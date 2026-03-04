import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;
let isConnected = false;

/**
 * Creates and returns a singleton Redis client.
 * Falls back gracefully if Redis is not available.
 */
export function getRedisClient() {
    if (redisClient) return redisClient;

    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    redisClient = new Redis({
        host,
        port,
        password,
        // Retry strategy: stop retrying after 3 attempts so app still boots without Redis
        retryStrategy(times) {
            if (times > 3) {
                console.warn('[Redis] ⚠️  Could not connect after 3 retries. Running without cache.');
                return null; // Stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
        enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
        isConnected = true;
        console.log('[Redis] ✅ Connected successfully');
    });

    redisClient.on('error', (err) => {
        isConnected = false;
        // Suppress repeated error logs
    });

    redisClient.on('close', () => {
        isConnected = false;
    });

    // Try to connect (non-blocking)
    redisClient.connect().catch(() => {
        // Silently fail — app works without Redis
    });

    return redisClient;
}

export function isRedisConnected() {
    return isConnected && redisClient && redisClient.status === 'ready';
}
