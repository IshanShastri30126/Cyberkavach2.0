import { Redis } from "@upstash/redis";
import { config } from "../config";

let redisAvailable = false;
let redis: Redis | null = null;

// Initialize Upstash Redis (HTTP-based — no TCP connections needed)
if (config.upstash.url && config.upstash.token) {
  try {
    redis = new Redis({
      url: config.upstash.url,
      token: config.upstash.token,
    });
    redisAvailable = true;
    console.log("[Redis] ✅ Upstash Redis configured (HTTP mode)");
  } catch (err) {
    console.warn("[Redis] ⚠️  Failed to initialize Upstash Redis:", err);
    redisAvailable = false;
  }
} else {
  console.warn("[Redis] ⚠️  Upstash credentials not set — running without caching");
}

// ─── Safe Wrappers (same API as before) ────────────────────

export async function redisSet(key: string, value: string, ttl?: number): Promise<void> {
  if (!redisAvailable || !redis) return;
  try {
    if (ttl) {
      await redis.set(key, value, { ex: ttl });
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    console.warn("[Redis] SET failed:", err);
  }
}

export async function redisGet(key: string): Promise<string | null> {
  if (!redisAvailable || !redis) return null;
  try {
    const data = await redis.get(key);
    if (data === null || data === undefined) return null;
    if (data === "[object Object]") {
      console.warn(`[Redis] Corrupted key detected for '${key}', invalidating cache.`);
      await redis.del(key);
      return null;
    }
    if (typeof data === "object") {
      return JSON.stringify(data);
    }
    return String(data);
  } catch (err) {
    console.warn("[Redis] GET failed:", err);
    return null;
  }
}

export async function redisDel(key: string): Promise<void> {
  if (!redisAvailable || !redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn("[Redis] DEL failed:", err);
  }
}

export { redisAvailable };
export default redis;
