import type { UIMessage } from 'ai';

export function extractTextFromParts(message: UIMessage): {
  content: string;
  reasoning: string | null;
} {
  const textParts: string[] = [];
  const reasoningParts: string[] = [];
  for (const part of message.parts) {
    if (part.type === 'text') {
      textParts.push(part.text);
    } else if (part.type === 'reasoning') {
      reasoningParts.push(part.text);
    }
  }
  const content = textParts.join('\n').trim();
  const reasoningJoined = reasoningParts.join('\n').trim();
  return {
    content,
    reasoning: reasoningJoined.length > 0 ? reasoningJoined : null,
  };
}

const ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateId(length = 15): string {
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}
