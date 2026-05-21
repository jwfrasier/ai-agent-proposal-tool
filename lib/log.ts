import pino from 'pino';
import { config } from './config';

export const log = pino({
  level: config.logLevel,
  base: { app: 'govcontracts' },
  ...(config.nodeEnv === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});

export type Logger = typeof log;
