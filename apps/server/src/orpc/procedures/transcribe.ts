import { pipeline } from '@huggingface/transformers';
import wavefile from 'wavefile';
import { z } from 'zod';
import { publicProcedure } from '../index';

const transcriber = await pipeline(
  'automatic-speech-recognition',
  'Xenova/whisper-tiny.en'
);

export const transcribeProcedures = {
  transcribe: publicProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        language: z.string().length(2).optional(),
        model: z.string().optional().default('tiny'),
        responseFormat: z
          .enum(['json', 'text', 'verbose'])
          .optional()
          .default('json'),
        includeTimestamps: z.boolean().optional().default(true),
      })
    )
    .output(
      z.object({
        text: z.string(),
      })
    )
    .handler(async ({ input }) => {
      try {
        const buffer = await input.file.arrayBuffer();
        const wav = new wavefile.WaveFile(new Uint8Array(buffer));
        wav.toBitDepth('32f'); // Pipeline expects input as a Float32Array
        wav.toSampleRate(16_000); // Whisper expects audio with a sampling rate of 16000
        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
          if (audioData.length > 1) {
            const SCALING_FACTOR = Math.sqrt(2);

            // Merge channels (into first channel to save memory)
            for (let i = 0; i < audioData[0].length; ++i) {
              audioData[0][i] =
                (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2;
            }
          }

          // Select first channel
          audioData = audioData[0];
        }

        const start = performance.now();
        const output = await transcriber(audioData);
        const end = performance.now();
        console.log(`Execution duration: ${(end - start) / 1000} seconds`);
        console.log(output);

        const result = Array.isArray(output) ? output[0].text : output.text;

        return { text: result };
      } catch (error) {
        console.error(error);
        throw new Error('Failed to transcribe audio');
      }
    }),
};
