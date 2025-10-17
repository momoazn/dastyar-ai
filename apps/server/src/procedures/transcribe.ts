import { z } from "zod";
import { defaultWhisperModel, env, whisperModelIds } from "@/config";
import { publicProcedure } from "./base";

// Type for model information
type ModelInfo = { id: string; name: string };

// Pretty names for UI
const RE_SPLIT_DELIMS = /[-_\s]+/;
const RE_DIGIT = /[0-9]/;
const RE_WHISPER_PREFIX = /^whisper-/i;

const toTitleCase = (s: string): string =>
  s
    .split(RE_SPLIT_DELIMS)
    .map((w) => (RE_DIGIT.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

const prettyWhisperName = (modelId: string): string => {
  const [vendor, model] = modelId.split("/");
  const vendorPretty = vendor?.charAt(0).toUpperCase() + vendor?.slice(1);
  const modelPretty = toTitleCase(
    model?.replace(RE_WHISPER_PREFIX, "Whisper ") ?? ""
  );
  return `${vendorPretty} ${modelPretty}`.trim();
};

// Fetch available models from the external Whisper server
let _modelsCache: { at: number; list: ModelInfo[] } | null = null;
const MODELS_TTL_MS = 60_000;

async function getWhisperModels(): Promise<ModelInfo[]> {
  const now = Date.now();
  if (_modelsCache && now - _modelsCache.at < MODELS_TTL_MS) {
    return _modelsCache.list;
  }
  try {
    const url = `${env.WHISPER_SERVER_URL.replace(/\/$/, "")}/models`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ModelInfo[];
    // Basic validation
    const list = Array.isArray(data)
      ? data.filter(
          (m) => m && typeof m.id === "string" && typeof m.name === "string"
        )
      : [];
    if (list.length > 0) {
      _modelsCache = { at: now, list };
      return list;
    }
  } catch {
    // ignore and fall back below
  }
  // Fallback: return configured ids (best effort)
  const list = (
    whisperModelIds.length > 0 ? whisperModelIds : [defaultWhisperModel]
  ).map((id) => ({ id, name: prettyWhisperName(id) }));
  _modelsCache = { at: now, list };
  return list;
}

export const transcribeProcedures = {
  models: publicProcedure.handler(async () => await getWhisperModels()),

  transcribe: publicProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        language: z.string().length(2).optional(),
        model: z.string().optional(),
      })
    )
    .output(z.string())
    .handler(async ({ input }) => {
      const startedAt = Date.now();
      const language = input.language ?? "fa";
      const modelId = input.model ?? defaultWhisperModel;
      // Validate model against whisper server list; if unknown, let server default
      let forwardModel: string | undefined;
      try {
        const available = await getWhisperModels();
        if (available.some((m) => m.id === modelId)) {
          forwardModel = modelId;
        }
      } catch {
        // ignore; we'll let server default
      }
      const fileInfo = {
        name: input.file.name,
        type: input.file.type,
        size: input.file.size,
      };
      console.log(
        `[transcribe] start model=${modelId} lang=${language} file=name:${fileInfo.name} type:${fileInfo.type} size=${fileInfo.size}`
      );

      try {
        const url = `${env.WHISPER_SERVER_URL.replace(/\/$/, "")}/transcribe`;
        const form = new FormData();
        form.append("file", input.file as unknown as Blob, input.file.name);
        if (forwardModel) {
          form.append("model", forwardModel);
        }
        form.append("language", language);

        const res = await fetch(url, { method: "POST", body: form });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Whisper server error (${res.status}): ${text.slice(0, 200)}`
          );
        }
        const json = (await res.json()) as { text?: string };
        const output = (json?.text ?? "").trim();

        const tookMs = Date.now() - startedAt;
        console.log(
          `[transcribe] success model=${modelId} lang=${language} took=${tookMs}ms chars=${
            output.length
          }`
        );
        return output;
      } catch (err) {
        const tookMs = Date.now() - startedAt;
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[transcribe] failed model=${modelId} lang=${language} took=${tookMs}ms error=${message}`,
          err
        );
        throw mapTranscriptionError(message);
      }
    }),
};

function mapTranscriptionError(message: string): Error {
  if (message.includes("fetch") || message.includes("Whisper server error")) {
    return new Error(
      "سرویس تشخیص گفتار در دسترس نیست. لطفاً Whisper Server را اجرا کنید."
    );
  }
  return new Error("تبدیل صوت به متن انجام نشد. لطفاً دوباره تلاش کنید.");
}
