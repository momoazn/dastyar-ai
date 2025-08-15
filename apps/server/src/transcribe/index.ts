import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { nodewhisper } from 'nodejs-whisper';

export async function saveFileToTmp(file: File) {
  const filePath = path.join(tmpdir(), file.name);
  const buffer = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(buffer));
  return filePath;
}

export const transcribe = async ({
  filePath,
  modelId,
  language,
}: {
  filePath: string;
  modelId?: string;
  language?: string;
}) => {
  const result = await nodewhisper(filePath, {
    modelName: modelId ?? 'tiny.en',
    logger: undefined,
    removeWavFileAfterTranscription: true,
    whisperOptions: {
      language: language ?? 'en',
      outputInJson: true,
      splitOnWord: true,
      wordTimestamps: false,
    },
  });
  return result;
};
