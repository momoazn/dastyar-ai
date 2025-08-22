import {
  type AutomaticSpeechRecognitionPipeline,
  pipeline,
} from '@huggingface/transformers';
import wavefile from 'wavefile';
import { z } from 'zod';
import { publicProcedure } from '../index';

// Cache transcribers by model id to avoid reloading per request
const transcriberCache = new Map<
  string,
  Promise<AutomaticSpeechRecognitionPipeline>
>();

const MODELS_LIST = [
  { id: 'Xenova/whisper-tiny', name: 'Xenova Tiny' },
  { id: 'Xenova/whisper-base', name: 'Xenova Base' },
  { id: 'Xenova/whisper-small', name: 'Xenova Small' },
  { id: 'Xenova/whisper-medium', name: 'Xenova Medium' },
  { id: 'Xenova/whisper-large-v3', name: 'Xenova Large v3' },
  { id: 'distil-whisper/distil-medium.en', name: 'Distil Medium English' },
];

const getTranscriber = (
  modelId: string
): Promise<AutomaticSpeechRecognitionPipeline> => {
  if (!transcriberCache.has(modelId)) {
    const create = (async () => {
      const p = await pipeline('automatic-speech-recognition', modelId);
      return p;
    })();
    transcriberCache.set(modelId, create);
  }
  const instance = transcriberCache.get(modelId);
  if (!instance) {
    throw new Error('Failed to initialize ASR transcriber');
  }
  return instance;
};

export const transcribeProcedures = {
  models: publicProcedure.handler(() => {
    return MODELS_LIST;
  }),
  transcribe: publicProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        language: z.string().length(2).optional(),
        model: z.string().optional().default(MODELS_LIST[0].id),
      })
    )
    .output(z.string())
    .handler(async ({ input }) => {
      const startedAt = Date.now();
      const language = input.language ?? 'fa';
      const modelId = input.model ?? MODELS_LIST[0].id;
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

        let wav: wavefile.WaveFile;
        try {
          wav = new wavefile.WaveFile(buffer);
        } catch {
          throw new Error('فرمت صوت نامعتبر است. لطفاً فایل WAV ارسال کنید.');
        }

        // Ensure correct format for Whisper
        wav.toBitDepth('32f');
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
          task: 'transcribe',
        });
        const output = Array.isArray(result) ? result[0].text : result.text;

        const tookMs = Date.now() - startedAt;
        console.log(
          `[transcribe] success model=${modelId} lang=${language} took=${tookMs}ms chars=${output?.length ?? 0}`
        );
        return (output ?? '').trim();
      } catch (err) {
        const tookMs = Date.now() - startedAt;
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[transcribe] failed model=${modelId} lang=${language} took=${tookMs}ms error=${message}`,
          err
        );

        // Map common errors to user-friendly messages
        if (message.includes('WAV') || message.includes('نامعتبر')) {
          throw new Error(
            'فایل صوتی پشتیبانی نمی‌شود. لطفاً فایل WAV ارسال کنید.'
          );
        }
        if (message.includes('onnx') || message.includes('NAPI')) {
          throw new Error(
            'راه‌اندازی موتور تشخیص گفتار با مشکل مواجه شد. سرور را ری‌استارت کنید یا در حالت توسعه از Node استفاده کنید.'
          );
        }
        if (
          message.includes('Failed to fetch') ||
          message.includes('network')
        ) {
          throw new Error(
            'دانلود مدل ناموفق بود. اتصال اینترنت را بررسی کنید.'
          );
        }

        throw new Error('تبدیل صوت به متن انجام نشد. لطفاً دوباره تلاش کنید.');
      }
    }),
};
