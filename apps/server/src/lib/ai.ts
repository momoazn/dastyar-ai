import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";

const envSchema = z.object({
	OLLAMA_BASE_URL: z.string().min(1),
	OLLAMA_DEFAULT_MODEL: z.string().optional(),
});

const env = envSchema.safeParse(process.env);

const baseURL = env.success
	? env.data.OLLAMA_BASE_URL
	: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";

export const ollama = createOpenAICompatible({
	baseURL,
	name: "ollama",
});

type OllamaModel = { id: string; displayName: string };

let cachedModels: { models: OllamaModel[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

function withoutTrailing(str: string, suffix: string) {
	return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
}

async function fetchModelsOpenAICompatible(apiBase: string): Promise<string[]> {
	const res = await fetch(new URL("models", apiBase));
	if (!res.ok) {
		throw new Error(
			`Failed to fetch models (OpenAI-compatible): ${res.status}`,
		);
	}
	const data = (await res.json()) as { data?: Array<{ id: string }> };
	return (data.data || []).map((m) => m.id).filter(Boolean);
}

async function fetchModelsOllamaNative(root: string): Promise<string[]> {
	const url = new URL("api/tags", root);
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch models (Ollama native): ${res.status}`);
	}
	const data = (await res.json()) as { models?: Array<{ name: string }> };
	return (data.models || []).map((m) => m.name).filter(Boolean);
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
	const now = Date.now();
	if (cachedModels && cachedModels.expiresAt > now) {
		return cachedModels.models;
	}

	const models: string[] = [];
	// Try OpenAI-compatible first
	try {
		const ids = await fetchModelsOpenAICompatible(
			baseURL.endsWith("/") ? baseURL : baseURL + "/",
		);
		models.push(...ids);
	} catch {}

	// Fallback to Ollama native tags endpoint
	if (models.length === 0) {
		const root = withoutTrailing(baseURL, "/v1");
		try {
			const ids = await fetchModelsOllamaNative(
				root.endsWith("/") ? root : root + "/",
			);
			models.push(...ids);
		} catch {}
	}

	const unique = Array.from(new Set(models));
	const normalized: OllamaModel[] = unique.map((id) => ({
		id,
		displayName: id,
	}));
	cachedModels = { models: normalized, expiresAt: now + CACHE_TTL_MS };
	return normalized;
}

export async function resolveModel(requested?: string): Promise<string> {
	const available = await listOllamaModels();
	const allow = new Set(available.map((m) => m.id));
	const envDefault = env.success
		? env.data.OLLAMA_DEFAULT_MODEL
		: process.env.OLLAMA_DEFAULT_MODEL;
	const fallback = envDefault || (available[0]?.id ?? "smollm2:1.7b");
	if (!requested) return fallback;
	return allow.has(requested) ? requested : fallback;
}
