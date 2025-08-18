import { z } from 'zod';
import { publicProcedure } from '../index';

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
        language: z.string().optional(),
        model_used: z.string().optional(),
        processing_ms: z.number().optional(),
        segments: z
          .array(
            z.object({
              start: z.number(),
              end: z.number(),
              text: z.string(),
            })
          )
          .optional(),
      })
    )
    .handler(async ({ input }) => {
      const whisperPort = process.env.WHISPER_PORT || '40002';
      const whisperServiceUrl =
        process.env.WHISPER_SERVICE_URL || `http://localhost:${whisperPort}`;

      // Validate file size (50MB limit)
      const maxFileSize = 50 * 1024 * 1024;
      if (input.file.size > maxFileSize) {
        throw new Error(
          `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`
        );
      }

      // Validate file type
      const supportedTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/m4a',
        'audio/mp4',
        'audio/flac',
        'audio/ogg',
        'audio/webm',
        'video/mp4',
        'video/webm',
      ];
      if (!supportedTypes.includes(input.file.type)) {
        throw new Error(`Unsupported file format: ${input.file.type}`);
      }

      // Create FormData to send file to Python whisper service
      const formData = new FormData();
      formData.append('file', input.file);

      // Append individual fields per updated Whisper API
      formData.append('model', input.model);
      if (input.language) {
        formData.append('language', input.language);
      }
      formData.append('response_format', input.responseFormat);
      formData.append('include_timestamps', String(input.includeTimestamps));

      const response = await fetch(`${whisperServiceUrl}/api/transcribe`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(120_000), // 2 minute timeout
      });

      if (!response.ok) {
        let errorMessage = `Transcription failed: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.detail) {
            errorMessage = `Transcription failed: ${errorBody.detail}`;
          }
        } catch {
          // Ignore JSON parse errors, use default message
        }
        throw new Error(errorMessage);
      }

      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error('Invalid response from transcription service');
      }

      // Validate and normalize response
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from transcription service');
      }

      // Type the result object based on expected whisper service response
      const typedResult = result as {
        text?: string;
        language?: string;
        model_used?: string;
        processing_ms?: number;
        segments?: Array<{ start: number; end: number; text: string }>;
      };

      // Handle different response formats from the Python service
      if (input.responseFormat === 'text') {
        // When format is 'text', Python service returns: { "text": "..." }
        const text =
          typeof result === 'string'
            ? result
            : typedResult.text || String(result);
        if (!text.trim()) {
          throw new Error('No transcription text received');
        }
        return { text: text.trim() };
      }

      // For 'json' and 'verbose' formats, return the structured response
      const transcriptionText = typedResult.text || '';
      if (!transcriptionText.trim()) {
        throw new Error('No transcription text received');
      }

      return {
        text: transcriptionText.trim(),
        language: typedResult.language || undefined,
        model_used: typedResult.model_used || undefined,
        processing_ms:
          typeof typedResult.processing_ms === 'number'
            ? typedResult.processing_ms
            : undefined,
        segments: Array.isArray(typedResult.segments)
          ? typedResult.segments
          : undefined,
      };
    }),
};
