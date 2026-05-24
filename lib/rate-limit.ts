interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * インメモリのスライディングウィンドウ方式レートリミット。
 * 10人規模のアプリ向け。サーバーレスのcold startでリセットされるが、
 * その挙動は「ややゆるくなる」だけで実害なし。
 */
const buckets = new Map<string, number[]>();

export async function rateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  const timestamps = buckets.get(identifier) ?? [];
  // 古いタイムスタンプを削除
  const recent = timestamps.filter((t) => t > windowStart);
  recent.push(now);
  buckets.set(identifier, recent);

  // メモリ膨張防止: ウィンドウ外を完全に切ったあとの長さで判定
  const count = recent.length;

  return {
    success: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    reset: now + windowSeconds,
  };
}
