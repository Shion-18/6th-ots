'use client';

/**
 * スケルトンの基本ブロック。読み込み中のレイアウト形状を示すプレースホルダ。
 * prefers-reduced-motion 環境では globals.css により pulse が抑制される。
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-container-highest rounded ${className}`} aria-hidden="true" />;
}

/**
 * パーティカード1枚分のスケルトン（my-teams 用）。
 */
export function TeamCardSkeleton() {
  return (
    <div className="md-card p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-14" />
          <Skeleton className="h-9 w-14" />
          <Skeleton className="h-9 w-14" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
}

/**
 * 共有ビュー（/view）用のスケルトン。ヘッダー + ポケモングリッド。
 */
export function TeamViewSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-surface elevation-2 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    </div>
  );
}
