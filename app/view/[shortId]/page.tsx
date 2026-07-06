'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Team } from '@/types/pokemon';
import TeamView from '@/components/ui/TeamView';
import TeamImageView from '@/components/ui/TeamImageView';
import { TeamViewSkeleton } from '@/components/ui/Skeleton';
import { useImageGenerator } from '@/hooks/useImageGenerator';
import { useToast, ToastContainer } from '@/components/ui/Toast';

export default function SharedTeamPage() {
  const params = useParams<{ shortId: string }>();
  const shortId = params?.shortId;
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();
  const { imageRef, isGenerating, generateImage } = useImageGenerator(team);

  useEffect(() => {
    if (!shortId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/share/${shortId}`);
        if (res.status === 404) {
          if (!cancelled) setError('共有リンクが見つかりません。期限切れまたは無効なリンクの可能性があります。');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setTeam(data.team);
          setError(null);
        }
      } catch (err) {
        console.error('共有パーティの取得に失敗:', err);
        if (!cancelled) setError('パーティデータの読み込みに失敗しました');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shortId]);

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
