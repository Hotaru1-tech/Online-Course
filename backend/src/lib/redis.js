import Redis from 'ioredis';
import { env } from './env.js';

const noopRedis = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  ping: async () => 'DISABLED'
};

export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL) : noopRedis;
