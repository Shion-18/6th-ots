import { kv } from '@vercel/kv';

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * スライディングウィンドウ方式のレートリミット（Vercel KV使用）
 */
export async function rateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  const requestId = `${now}:${Math.random().toString(36).slice(2, 8)}`;

  try {
    const pipe = kv.pipeline();
    pipe.zremrangebyscore(key, 0, windowStart);
    pipe.zadd(key, { score: now, member: requestId });
    pipe.zcard(key);
    pipe.expire(key, windowSeconds);

    const results = await pipe.exec();
    const count = results[2] as number;

    return {
      success: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      reset: now + windowSeconds,
    };
  } catch (error) {
    // KV障害時はレートリミットをバイパス（可用性優先）
    console.error('Rate limit check failed:', error);
    return { success: true, remaining: maxRequests, reset: now + windowSeconds };
  }
}
