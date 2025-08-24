import fs from 'node:fs';
import pino from 'pino';
import { getConfig } from '../config';

// Central Pino logger configured from app config
export const createLogger = () => {
  const config = getConfig();

  // Ensure log dir exists (defensive, also done in config validation)
  if (!fs.existsSync(config.logging.dir)) {
    fs.mkdirSync(config.logging.dir, { recursive: true });
  }

  // Configure transport targets: file (always) + pretty console (dev)
  const targets: pino.TransportTargetOptions[] = [
    {
      target: 'pino/file',
      level: config.logging.level,
      options: { destination: config.logging.file },
    },
  ];
  if (config.logging.pretty) {
    targets.push({
      target: 'pino-pretty',
      level: config.logging.level,
      options: {
        destination: 1,
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        singleLine: false,
      },
    });
  }
  const transport = pino.transport({ targets });

  const logger = pino(
    {
      level: config.logging.level,
      redact: config.logging.redactPaths,
      base: { service: 'dastyar-ai', env: config.environment },
      formatters: {
        level: (label) => ({ level: label }),
      },
      messageKey: 'message',
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    transport as unknown as pino.DestinationStream
  );

  // Flush on process exit (best effort for async destination)
  const flushAndClose = () => {
    try {
      logger.flush?.();
    } catch {
      // ignore
    }
  };
  process.on('beforeExit', flushAndClose);
  process.on('exit', flushAndClose);
  process.on('SIGINT', () => {
    flushAndClose();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    flushAndClose();
    process.exit(0);
  });

  return logger;
};

export type Logger = ReturnType<typeof createLogger>;
