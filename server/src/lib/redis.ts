import Redis from "ioredis";
import { config } from "../config";

let redisAvailable = false;

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.warn("[Redis] Max retries reached — giving up reconnection");
      return null; // stop retrying
    }
    const delay = Math.min(times * 500, 5000); // exponential backoff, max 5s
    console.log(`[Redis] Retry #${times} in ${delay}ms...`);
    return delay;
  },
  lazyConnect: true,
  connectTimeout: 5000,
  commandTimeout: 3000,
  enableOfflineQueue: false,
});

redis.on("error", (err) => {
  if (redisAvailable) {
    console.warn("[Redis] Connection lost:", err.message);
  }
  redisAvailable = false;
});

redis.on("connect", () => {
  redisAvailable = true;
  console.log("[Redis] ✅ Connected successfully");
});

redis.on("close", () => {
  redisAvailable = false;
});

redis.on("reconnecting", () => {
  console.log("[Redis] 🔄 Reconnecting...");
});

// Try connecting but don't crash if Redis is unavailable
redis.connect().catch(() => {
  redisAvailable = false;
  console.warn("[Redis] ⚠️  Could not connect — running without caching");
});

// Periodic reconnection attempt if Redis is down
setInterval(async () => {
  if (!redisAvailable) {
    try {
      await redis.ping();
      redisAvailable = true;
      console.log("[Redis] ✅ Reconnected via periodic check");
    } catch {
      // still unavailable, silent
    }
  }
}, 30000); // every 30 seconds

// Safe wrappers that won't hang
export async function redisSet(key: string, value: string, ttl?: number): Promise<void> {
  if (!redisAvailable) return;
  try {
    if (ttl) {
      await redis.set(key, value, "EX", ttl);
    } else {
      await redis.set(key, value);
    }
  } catch {
    // silently fail
  }
}

export async function redisGet(key: string): Promise<string | null> {
  if (!redisAvailable) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function redisDel(key: string): Promise<void> {
  if (!redisAvailable) return;
  try {
    await redis.del(key);
  } catch {
    // silently fail
  }
}

export { redisAvailable };
export default redis;
