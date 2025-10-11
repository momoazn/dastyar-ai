import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { WaveFile } from "wavefile";
import { z } from "zod";
import { env } from "@/config";
import { publicProcedure } from "./base";

// Type for the ASR pipeline
type ASRPipeline = (
  input: Float32Array,
  options: { language?: string; task: "transcribe" }
) => Promise<{ text: string } | Array<{ text: string }>>;

// Lazy import transformers to avoid initializing native providers at startup
type OnnxBackendConfig = {
  backend?: "wasm" | "webgpu" | "cpu";
  wasm?: { wasmPaths?: string };
};

// Type for the transformers environment
type TransformersEnv = {
  allowRemoteModels: boolean;
  localModelPath?: string;
  cacheDir?: string;
  backends?: { onnx?: OnnxBackendConfig };
};

// Type for the transformers module
type TransformersModule = {
  env: TransformersEnv;
  pipeline: (task: string, modelId: string) => Promise<ASRPipeline>;
};

// Type for model information
type ModelInfo = { id: string; name: string };

// Hoisted regex patterns and sort order constants
const RE_SPLIT_DELIMS = /[-_\s]+/;
const RE_DIGIT = /[0-9]/;
const RE_WHISPER_PREFIX = /^whisper-/i;
const SIZE_ORDER = [
  "tiny",
  "base",
  "small",
  "medium",
  "large",
  "large v2",
  "large v3",
] as const;

// Cache transcribers by model id to avoid reloading per request
const transcriberCache = new Map<string, Promise<ASRPipeline>>();

export const transcribeProcedures = {
  models: publicProcedure.handler(() => {
    const models = discoverInstalledWhisperModels();
    if (models.length > 0) {
      return models;
    }
    // Fallback to allowed remote models only if none installed
    const allowed = env.WHISPER_MODELS.split(",").map((id) => ({
      id,
      name: prettyWhisperName(id),
    }));
    return allowed;
  }),
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
      const discovered = discoverInstalledWhisperModels();
      const defaultModel =
        discovered[0]?.id ??
        env.WHISPER_MODELS.split(",")[0] ??
        "Xenova/whisper-tiny";
      const modelId = input.model ?? defaultModel;
      const fileInfo = {
        name: input.file.name,
        type: input.file.type,
        size: input.file.size,
      };
      console.log(
        `[transcribe] start model=${modelId} lang=${language} file=name:${fileInfo.name} type:${fileInfo.type} size:${fileInfo.size}`
      );

      try {
        // Expect a WAV file from the client. Convert to Float32Array @ 16k mono
        const arrayBuffer = await input.file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let wav: WaveFile;
        try {
          wav = new WaveFile(buffer);
        } catch {
          throw new Error("فرمت صوت نامعتبر است. لطفاً فایل WAV ارسال کنید.");
        }

        // Ensure correct format for Whisper
        wav.toBitDepth("32f");
        wav.toSampleRate(16_000);

        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
          if (audioData.length > 1) {
            const SCALING_FACTOR = Math.sqrt(2);
            for (let i = 0; i < audioData[0].length; ++i) {
              // Merge stereo into mono
              audioData[0][i] =
                (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2;
            }
          }
          audioData = audioData[0];
        }

        let float32Audio: Float32Array;
        if (Array.isArray(audioData)) {
          float32Audio = audioData[0] as Float32Array;
        } else {
          float32Audio = audioData as unknown as Float32Array;
        }

        const transcriber = await getTranscriber(modelId);

        const result = await transcriber(float32Audio, {
          language: input.language ?? undefined,
          task: "transcribe",
        });
        const output = Array.isArray(result) ? result[0].text : result.text;

        const tookMs = Date.now() - startedAt;
        console.log(
          `[transcribe] success model=${modelId} lang=${language} took=${tookMs}ms chars=${output?.length ?? 0}`
        );
        return (output ?? "").trim();
      } catch (err) {
        const tookMs = Date.now() - startedAt;
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[transcribe] failed model=${modelId} lang=${language} took=${tookMs}ms error=${message}`,
          err
        );

        // Map common errors to user-friendly messages
        if (message.includes("WAV") || message.includes("نامعتبر")) {
          throw new Error(
            "فایل صوتی پشتیبانی نمی‌شود. لطفاً فایل WAV ارسال کنید."
          );
        }
        if (message.includes("onnx") || message.includes("NAPI")) {
          throw new Error(
            "راه‌اندازی موتور تشخیص گفتار با مشکل مواجه شد. سرور را ری‌استارت کنید یا در حالت توسعه از Node استفاده کنید."
          );
        }
        if (
          message.includes("Failed to fetch") ||
          message.includes("network")
        ) {
          throw new Error(
            "دانلود مدل ناموفق بود. اتصال اینترنت را بررسی کنید."
          );
        }

        throw new Error("تبدیل صوت به متن انجام نشد. لطفاً دوباره تلاش کنید.");
      }
    }),
};

async function tryImportModule(id: string): Promise<TransformersModule | null> {
  try {
    const m = (await import(id)) as unknown;
    return m as TransformersModule;
  } catch {
    return null;
  }
}

async function getTransformers(): Promise<TransformersModule> {
  // Prefer the web/browser build explicitly to avoid loading onnxruntime-node in Bun
  // Preload the web ONNX runtime to bias the environment toward WASM
  try {
    await import("onnxruntime-web");
  } catch {
    // ignore if not available; the transformers web build will still work
  }

  const mod =
    (await tryImportModule(
      "@huggingface/transformers/dist/transformers.min.js"
    )) ||
    (await tryImportModule("@huggingface/transformers/dist/transformers.js")) ||
    (await tryImportModule("@huggingface/transformers"));

  if (!mod) {
    throw new Error("Failed to load @huggingface/transformers");
  }
  // Resolve paths next to the compiled binary for offline execution
  const execDir = path.dirname(process.execPath);
  const localWasmDir = env.WHISPER_WASM_DIR || path.join(execDir, "wasm");
  const localModelsDir =
    env.WHISPER_MODELS_DIR || path.join(execDir, "whisper-models");

  // Enforce offline mode and local assets
  mod.env.allowRemoteModels = false;
  mod.env.localModelPath = localModelsDir;
  mod.env.cacheDir =
    env.WHISPER_CACHE_DIR || path.join(execDir, ".whisper-cache");

  const onnxBackend = mod.env.backends?.onnx;
  if (onnxBackend) {
    onnxBackend.backend = "wasm";
    if (onnxBackend.wasm) {
      // Point to local WASM folder next to the binary
      onnxBackend.wasm.wasmPaths = localWasmDir + path.sep;
    }
  }
  return mod;
}

function toTitleCase(s: string): string {
  return s
    .split(RE_SPLIT_DELIMS)
    .map((w) => (RE_DIGIT.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function prettyWhisperName(modelId: string): string {
  const [vendor, model] = modelId.split("/");
  const vendorPretty = vendor?.charAt(0).toUpperCase() + vendor?.slice(1);
  const modelPretty = toTitleCase(
    model?.replace(RE_WHISPER_PREFIX, "Whisper ") ?? ""
  );
  return `${vendorPretty} ${modelPretty}`.trim();
}

function discoverInstalledWhisperModels(): ModelInfo[] {
  const execDir = path.dirname(process.execPath);
  const modelsRoot =
    env.WHISPER_MODELS_DIR || path.join(execDir, "whisper-models");
  if (!existsSync(modelsRoot)) {
    return [];
  }
  const result: ModelInfo[] = [];
  // Expect layout: <modelsRoot>/<vendor>/<model>/*
  for (const vendor of readdirSync(modelsRoot)) {
    const vendorPath = path.join(modelsRoot, vendor);
    if (!statSync(vendorPath).isDirectory()) {
      continue;
    }
    for (const model of readdirSync(vendorPath)) {
      const modelPath = path.join(vendorPath, model);
      if (!statSync(modelPath).isDirectory()) {
        continue;
      }
      // Heuristic: consider it installed if it has config.json or onnx dir
      const hasConfig = existsSync(path.join(modelPath, "config.json"));
      const hasOnnx = existsSync(path.join(modelPath, "onnx"));
      if (hasConfig || hasOnnx) {
        const id = `${vendor}/${model}`;
        result.push({ id, name: prettyWhisperName(id) });
      }
    }
  }
  // Sort by model size order if recognizable; otherwise alphabetical
  result.sort((a, b) => {
    const ai = SIZE_ORDER.findIndex(
      (k) =>
        a.id.includes(k.replace(" ", "-")) || a.id.includes(k.replace(" ", ""))
    );
    const bi = SIZE_ORDER.findIndex(
      (k) =>
        b.id.includes(k.replace(" ", "-")) || b.id.includes(k.replace(" ", ""))
    );
    if (ai !== -1 && bi !== -1 && ai !== bi) {
      return ai - bi;
    }
    return a.id.localeCompare(b.id);
  });
  return result;
}

function getTranscriber(modelId: string): Promise<ASRPipeline> {
  if (!transcriberCache.has(modelId)) {
    const create = (async () => {
      const { pipeline } = await getTransformers();
      const p = await pipeline("automatic-speech-recognition", modelId);
      return p;
    })();
    transcriberCache.set(modelId, create);
  }
  const instance = transcriberCache.get(modelId);
  if (!instance) {
    throw new Error("Failed to initialize ASR transcriber");
  }
  return instance;
}
