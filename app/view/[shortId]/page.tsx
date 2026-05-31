'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Team } from '@/types/pokemon';
import TeamView from '@/components/ui/TeamView';
import TeamImageView from '@/components/ui/TeamImageView';
import { useImageGenerator } from '@/hooks/useImageGenerator';
import { useToast, ToastContainer } from '@/components/ui/Toast';

export default function ViewPage({ params }: { params: Promise<{ shortId: string }> }) {
  const { shortId } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { imageRef, isGenerating, generateImage } = useImageGenerator(team);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(shortId)}`);
        if (cancelled) return;

        if (res.status === 404) {
          setError('共有リンクが見つかりません。期限切れの可能性があります。');
        } else if (!res.ok) {
          setError('パーティデータの読み込みに失敗しました');
        } else {
          const data = await res.json();
          if (data.success && data.team) {
            setTeam(data.team);
            setError(null);
          } else {
            setError('パーティデータの読み込みに失敗しました');
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error('共有チーム取得エラー:', err);
        setError('パーティデータの読み込みに失敗しました');
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
    showToast(ok ? 'success' : 'error', ok ? 'URLをコピーしました' : 'URLのコピーに失敗しました');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">エラー</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
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

      <div className="hidden">
        <TeamImageView team={team} elementRef={imageRef} />
      </div>

      <div className="fixed right-6 z-50" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
        <button
          onClick={generateImage}
          disabled={isGenerating}
          className={`font-bold py-4 px-6 rounded-full shadow-lg transition-all ${
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white hover:scale-105'
          }`}
        >
          {isGenerating ? '生成中...' : '📸 画像保存'}
        </button>
      </div>
    </>
  );
}
