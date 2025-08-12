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
  modelName,
  language,
}: {
  filePath: string;
  modelName?: string;
  language?: string;
}) => {
  const result = await nodewhisper(filePath, {
    modelName: modelName ?? 'tiny.en',
    whisperOptions: {
      language: language ?? 'en',
      outputInJson: true,
    },
  });
  return result;
};
