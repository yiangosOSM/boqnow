import type { ConnectionOptions } from 'bullmq'

export function getRedisConnection(): ConnectionOptions {
  if (process.env.MOCK_AUTH === 'true') {
    return { host: '127.0.0.1', port: 6379 }
  }

  const url = process.env.UPSTASH_REDIS_URL ?? ''
  return {
    host: url.replace('https://', '').replace('http://', '').split(':')[0] || 'localhost',
    port: 6379,
    password: process.env.UPSTASH_REDIS_TOKEN,
    tls: url.startsWith('https') ? {} : undefined,
  }
}
