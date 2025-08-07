import 'dotenv/config';

import { createOpenAI } from '@ai-sdk/openai';
import { RPCHandler } from '@orpc/server/fetch';
import { streamText } from 'ai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { stream } from 'hono/streaming';
import { createContext } from './lib/context';
import { appRouter } from './routers/index';

// const google = createGoogleGenerativeAI({
//   apiKey: process.env.GOOGLE_API_KEY,
// });

const ollama = createOpenAI({
  baseURL: 'http://localhost:11434',
  apiKey: '',
});

const app = new Hono();

app.use(logger());
app.use(
  '/*',
  cors({
    origin: process.env.CORS_ORIGIN || '',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
);

const handler = new RPCHandler(appRouter);
app.use('/rpc/*', async (c, next) => {
  const context = await createContext({ context: c });
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: '/rpc',
    context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }
  await next();
});

app.post('/ai', async (c) => {
  const body = await c.req.json();
  const messages = body.messages || [];
  const result = streamText({
    // model: google('gemini-2.0-flash'),
    model: ollama('llama3.1:8b'),
    messages,
  });

  c.header('X-Vercel-AI-Data-Stream', 'v1');
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return stream(c, (s) => s.pipe(result.toDataStream()));
});

app.get('/', (c) => {
  return c.text('OK');
});

export default app;
