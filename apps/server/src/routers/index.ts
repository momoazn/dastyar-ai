import { generateObject } from "ai";
import { inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
	LanguageEnum,
	ModelProviderEnum,
	models,
	ToneEnum,
	translations,
} from "../db/schema";
import {
	listLmstudioModels,
	listOllamaModels,
	lmstudio,
	ollama,
	resolveModel,
} from "../lib/ai";
import {
	clearThread,
	createThread,
	deleteMessage,
	deleteThread,
	getMessagesByThread,
	getThread,
	listThreads,
	renameThread,
	setArchived,
} from "../lib/chat-store";
import { generateId } from "../lib/ids";
import { publicProcedure } from "../lib/orpc";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	models: {
		listOllama: publicProcedure.handler(async () => {
			const [lmstudioList, ollamaList] = await Promise.all([
				listLmstudioModels(),
				listOllamaModels(),
			]);

			const toUpsert = [
				...ollamaList.map((m) => ({
					id: generateId(),
					name: m.displayName,
					modelId: m.id,
					provider: ModelProviderEnum.OLLAMA,
				})),
				...lmstudioList.map((m) => ({
					id: generateId(),
					name: m.displayName,
					modelId: m.id,
					provider: ModelProviderEnum.LMSTUDIO,
				})),
			];

			if (toUpsert.length > 0) {
				await db
					.insert(models)
					.values(toUpsert)
					.onConflictDoUpdate({
						target: [models.provider, models.modelId],
						set: {
							name: sql`excluded.name`,
							updatedAt: sql`(unixepoch())`,
						},
					});
			}

			const rows = await db
				.select({
					id: models.id,
					name: models.name,
					modelId: models.modelId,
					provider: models.provider,
					isEnabled: models.isEnabled,
				})
				.from(models)
				.where(
					inArray(models.provider, [
						ModelProviderEnum.LMSTUDIO,
						ModelProviderEnum.OLLAMA,
					]),
				);
			return rows;
		}),
	},
	threads: {
		create: publicProcedure
			.input(z.object({ title: z.string().optional() }).optional())
			.handler(async ({ input }) => {
				const created = await createThread({ title: input?.title });
				return created;
			}),
		list: publicProcedure
			.input(z.object({ includeArchived: z.boolean().optional() }).optional())
			.handler(async ({ input }) => {
				try {
					const rows = await listThreads({
						includeArchived: input?.includeArchived,
					});
					return rows;
				} catch {
					return [] as const;
				}
			}),
		get: publicProcedure
			.input(z.object({ id: z.string() }))
			.handler(async ({ input }) => {
				const row = await getThread(input.id);
				return row;
			}),
		rename: publicProcedure
			.input(z.object({ id: z.string(), title: z.string().min(1) }))
			.handler(async ({ input }) => {
				await renameThread(input.id, input.title);
				return { ok: true } as const;
			}),
		archive: publicProcedure
			.input(z.object({ id: z.string(), isArchived: z.boolean() }))
			.handler(async ({ input }) => {
				await setArchived(input.id, input.isArchived);
				return { ok: true } as const;
			}),
		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.handler(async ({ input }) => {
				await deleteThread(input.id);
				return { ok: true } as const;
			}),
	},
	messages: {
		listByThread: publicProcedure
			.input(
				z.object({
					threadId: z.string(),
					limit: z.number().optional(),
					cursor: z.string().optional(),
					order: z.enum(["asc", "desc"]).optional(),
				}),
			)
			.handler(async ({ input }) => {
				const rows = await getMessagesByThread({
					threadId: input.threadId,
					limit: input.limit,
					cursor: input.cursor ?? null,
					order: input.order ?? "desc",
				});
				return rows;
			}),
		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.handler(async ({ input }) => {
				await deleteMessage(input.id);
				return { ok: true } as const;
			}),
		clearThread: publicProcedure
			.input(z.object({ threadId: z.string() }))
			.handler(async ({ input }) => {
				await clearThread(input.threadId);
				return { ok: true } as const;
			}),
	},
	translations: {
		translate: publicProcedure
			.input(
				z.object({
					text: z.string().min(1),
					sourceLanguage: z.enum(Object.values(LanguageEnum)),
					targetLanguage: z.enum(Object.values(LanguageEnum)),
					tone: z.enum(Object.values(ToneEnum)).optional(),
					model: z.string().optional(),
					provider: z.enum(Object.values(ModelProviderEnum)).optional(),
				}),
			)
			.handler(async ({ input }) => {
				const selectedProvider = input.provider ?? ModelProviderEnum.OLLAMA;
				const modelId =
					selectedProvider === ModelProviderEnum.OLLAMA
						? await resolveModel(input.model)
						: (input.model ?? "");
				const providerModel =
					selectedProvider === ModelProviderEnum.LMSTUDIO
						? lmstudio(modelId)
						: ollama(modelId);

				const prompt = [
					`You are a professional translator. Translate the text from ${input.sourceLanguage} to ${input.targetLanguage}.`,
					input.tone ? `Use a ${input.tone} tone.` : undefined,
					"Preserve meaning and formatting. Return only the translated text without extra commentary.",
					"Always return a json object with the translated text.",
					"---",
					input.text,
				]
					.filter(Boolean)
					.join("\n");

				const result = await generateObject({
					model: providerModel,
					schema: z.object({
						translatedText: z
							.string()
							.describe("Only the translated text. No extra commentary."),
					}),
					prompt,
				}).catch((error) => {
					console.error("========> error", error);
					return null;
				});

				if (!result) {
					return { id: null, translatedText: null } as const;
				}

				const id = generateId(15);
				try {
					await db.insert(translations).values({
						id,
						sourceText: input.text,
						translatedText: result.object.translatedText,
						model: modelId,
						sourceLanguage: input.sourceLanguage,
						targetLanguage: input.targetLanguage,
						tone:
							(input.tone as (typeof ToneEnum)[keyof typeof ToneEnum]) ?? null,
					});
				} catch (error) {
					console.error("========> error", error);
				}

				return { id, translatedText: result.object.translatedText } as const;
			}),
	},
};
export type AppRouter = typeof appRouter;
