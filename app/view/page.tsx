'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Team } from '@/types/pokemon';
import { decodeTeam } from '@/lib/team-encoder';
import TeamView from '@/components/ui/TeamView';
import TeamImageView from '@/components/ui/TeamImageView';
import { useImageGenerator } from '@/hooks/useImageGenerator';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { TeamViewSkeleton } from '@/components/ui/Skeleton';

function ViewPageContent() {
  const searchParams = useSearchParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();

  // 画像生成フック
  const { imageRef, isGenerating, generateImage } = useImageGenerator(team);

  useEffect(() => {
    const data = searchParams.get('data');

    if (data) {
      try {
        const decodedTeam = decodeTeam(decodeURIComponent(data));
        setTeam(decodedTeam);
        setError(null);
      } catch (err) {
        console.error('デコードエラー:', err);
        setError('パーティデータの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
      return;
    }

    setError('パーティデータが見つかりません');
    setLoading(false);
  }, [searchParams]);

  const handleShare = async () => {
    const { copyToClipboard } = await import('@/lib/clipboard');
    const ok = await copyToClipboard(window.location.href);
    showToast(ok ? 'success' : 'error', ok ? 'URLをコピーしました！' : 'URLのコピーに失敗しました');
  };

  if (loading) {
    return (
      <div aria-busy="true">
        <span role="status" aria-live="polite" className="sr-only">パーティを読み込み中</span>
        <TeamViewSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center p-8 bg-card rounded-lg border border-line max-w-md">
          <h2 className="text-2xl font-bold text-ink mb-2">エラー</h2>
          <p className="text-ink-muted mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-accent hover:bg-accent-strong text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <TeamView team={team} onShare={handleShare} />

      {/* 非表示の画像生成用ビュー */}
      <div className="hidden">
        <TeamImageView team={team} elementRef={imageRef} />
      </div>

      {/* 画像生成ボタン（固定位置） */}
      <div className="fixed right-6 z-50" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
        <button
          onClick={generateImage}
          disabled={isGenerating}
          className={`font-bold py-4 px-6 rounded-full shadow-sm transition-colors ${
            isGenerating
              ? 'bg-line text-ink-faint cursor-not-allowed'
              : 'bg-accent hover:bg-accent-strong text-white'
          }`}
        >
          {isGenerating ? '生成中...' : '画像を保存'}
        </button>
      </div>
    </>
  );
}

export default function ViewPage() {
  return (
    <Suspense fallback={<TeamViewSkeleton />}>
      <ViewPageContent />
    </Suspense>
  );
}
