import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Ollama } from "ollama";
import { z } from "zod";

const envSchema = z.object({
	OLLAMA_BASE_URL: z.string().min(1),
	OLLAMA_DEFAULT_MODEL: z.string().optional(),
	LMSTUDIO_BASE_URL: z.string().min(1),
	LMSTUDIO_DEFAULT_MODEL: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

const DEFAULT_OLLAMA_OPENAI_BASE_URL = "http://localhost:11434/v1" as const;
const DEFAULT_LMSTUDIO_OPENAI_BASE_URL = "http://127.0.0.1:1234/v1" as const;
const DEFAULT_FALLBACK_MODEL = "smollm2:1.7b" as const;

const OLLAMA_OPENAI_BASE_URL =
	(parsedEnv.success
		? parsedEnv.data.OLLAMA_BASE_URL
		: process.env.OLLAMA_BASE_URL) ?? DEFAULT_OLLAMA_OPENAI_BASE_URL;

const LMSTUDIO_OPENAI_BASE_URL =
	(parsedEnv.success
		? parsedEnv.data.LMSTUDIO_BASE_URL
		: process.env.LMSTUDIO_BASE_URL) ?? DEFAULT_LMSTUDIO_OPENAI_BASE_URL;

const OLLAMA_DEFAULT_MODEL = parsedEnv.success
	? parsedEnv.data.OLLAMA_DEFAULT_MODEL
	: process.env.OLLAMA_DEFAULT_MODEL;

export const ollama = createOpenAICompatible({
	baseURL: OLLAMA_OPENAI_BASE_URL,
	name: "ollama",
});

export const lmstudio = createOpenAICompatible({
	baseURL: LMSTUDIO_OPENAI_BASE_URL,
	name: "lmstudio",
});

export type ModelType = { id: string; displayName: string };

const ensureTrailingSlash = (value: string): string =>
	value.endsWith("/") ? value : `${value}/`;

const stripSuffix = (value: string, suffix: string): string =>
	value.endsWith(suffix) ? value.slice(0, value.length - suffix.length) : value;

const fetchOpenAICompatibleModels = async (
	apiBase: string,
): Promise<string[]> => {
	const url = new URL("models", ensureTrailingSlash(apiBase));
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch models (OpenAI-compatible): ${response.status}`,
		);
	}
	const json: { data?: Array<{ id: string }> } = await response.json();
	return (json.data ?? []).map((m) => m.id).filter(Boolean);
};

export const listOllamaModels = async (): Promise<ModelType[]> => {
	const foundIds = new Set<string>();

	// Primary: OpenAI-compatible endpoint
	try {
		const ids = await fetchOpenAICompatibleModels(OLLAMA_OPENAI_BASE_URL);
		for (const id of ids) foundIds.add(id);
	} catch {}

	// Fallback: Ollama native endpoint
	if (foundIds.size === 0) {
		const host = ensureTrailingSlash(
			stripSuffix(OLLAMA_OPENAI_BASE_URL, "/v1"),
		);
		try {
			const response = await new Ollama({ host }).list();
			const ids = response.models.map((m) => m.model).filter(Boolean);
			for (const id of ids) foundIds.add(id);
		} catch {}
	}

	return Array.from(foundIds).map((id) => ({ id, displayName: id }));
};

export const listLmstudioModels = async (): Promise<ModelType[]> => {
	try {
		const ids = await fetchOpenAICompatibleModels(LMSTUDIO_OPENAI_BASE_URL);
		return ids.map((id) => ({ id, displayName: id }));
	} catch {
		return [];
	}
};

export const resolveModel = async (requested?: string): Promise<string> => {
	const available = await listOllamaModels();
	const allowed = new Set(available.map((m) => m.id));
	const fallback =
		OLLAMA_DEFAULT_MODEL || available[0]?.id || DEFAULT_FALLBACK_MODEL;
	if (!requested) return fallback;
	return allowed.has(requested) ? requested : fallback;
};
