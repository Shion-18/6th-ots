'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Team } from '@/types/pokemon';
import { decodeTeam } from '@/lib/team-encoder';
import TeamView from '@/components/ui/TeamView';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { TeamViewSkeleton } from '@/components/ui/Skeleton';

function ViewPageContent() {
  const searchParams = useSearchParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 md-card max-w-md">
          <h2 className="md-headline-small text-on-surface mb-2">エラー</h2>
          <p className="md-body-medium text-on-surface-variant mb-6">{error}</p>
          <Link
            href="/"
            className="btn btn-filled state-layer"
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
