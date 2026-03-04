import { getRedisClient, isRedisConnected } from '../config/redisConfig.js';

// TTL Constants (in seconds)
export const TTL = {
    QUESTIONS: 60 * 60 * 24,     // 24 hours — question data rarely changes
    USER_PAPERS: 60 * 5,         // 5 minutes — user paper list
    USER_PROFILE: 60 * 10,       // 10 minutes — user profile/session data
    NOTIFICATIONS: 60 * 2,       // 2 minutes — notifications
    SHORT: 60,                    // 1 minute — general short-lived data
};

/**
 * Get a value from Redis cache.
 * Returns parsed object or null if miss/error.
 */
export async function cacheGet(key) {
    if (!isRedisConnected()) return null;
    try {
        const redis = getRedisClient();
        const raw = await redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Set a value in Redis cache with a TTL.
 */
export async function cacheSet(key, value, ttl = TTL.SHORT) {
    if (!isRedisConnected()) return;
    try {
        const redis = getRedisClient();
        await redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch {
        // Silently fail — cache is not critical
    }
}

/**
 * Delete one or more keys from cache.
 */
export async function cacheDel(...keys) {
    if (!isRedisConnected() || keys.length === 0) return;
    try {
        const redis = getRedisClient();
        await redis.del(...keys);
    } catch {
        // Silently fail
    }
}

/**
 * Delete all keys matching a pattern (e.g. 'papers:user:42:*')
 */
export async function cacheDelPattern(pattern) {
    if (!isRedisConnected()) return;
    try {
        const redis = getRedisClient();
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch {
        // Silently fail
    }
}

/**
 * Cache-aside helper: Try cache first, run fn() on miss, store result.
 * @param {string} key - Cache key
 * @param {function} fn - Async function that fetches real data
 * @param {number} ttl - TTL in seconds
 */
export async function cacheAside(key, fn, ttl = TTL.SHORT) {
    // Try cache first
    const cached = await cacheGet(key);
    if (cached !== null) {
        return { data: cached, fromCache: true };
    }

    // Cache miss — fetch from source
    const data = await fn();

    // Store in cache (fire and forget)
    cacheSet(key, data, ttl);

    return { data, fromCache: false };
}
