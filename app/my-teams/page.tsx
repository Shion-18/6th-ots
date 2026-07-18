'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '@/types/pokemon';
import { getTeamsFromAPI, deleteTeamFromAPI } from '@/lib/team-storage';
import { createShareUrl } from '@/lib/share';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { TeamCardSkeleton } from '@/components/ui/Skeleton';

export default function MyTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareTeamName, setShareTeamName] = useState('');
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const fetchedTeams = await getTeamsFromAPI();
        setTeams(fetchedTeams);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleDelete = async (teamId: string, teamName: string) => {
    if (confirm(`「${teamName}」を削除しますか？`)) {
      const success = await deleteTeamFromAPI(teamId);
      if (success) {
        const updatedTeams = await getTeamsFromAPI();
        setTeams(updatedTeams);
      } else {
        showToast('error', '削除に失敗しました');
      }
    }
  };

  const handleEdit = (teamId: string) => {
    router.push(`/builder?teamId=${teamId}`);
  };

  const handleShare = async (team: Team) => {
    try {
      const url = await createShareUrl(team);
      setShareUrl(url);
      setShareTeamName(team.name);
      setShowQRModal(true);
    } catch (error) {
      console.error('Share failed:', error);
      showToast('error', error instanceof Error ? error.message : '共有リンクの作成に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top app bar */}
      <div className="bg-surface elevation-2">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="md-title-large text-on-surface">マイパーティ</h1>
              <p className="md-body-medium text-on-surface-variant mt-1">保存済み: {teams.length}/1</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="btn btn-text state-layer"
            >
              ← ホーム
            </button>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div aria-busy="true">
            <span role="status" aria-live="polite" className="sr-only">パーティを読み込み中</span>
            <TeamCardSkeleton />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12 md-card">
            <p className="md-body-large text-on-surface-variant mb-4">保存されたパーティがありません</p>
            <button
              onClick={() => router.push('/builder')}
              className="btn btn-filled state-layer"
            >
              新しいパーティを作成
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 新規作成ボタン */}
            <div className="text-center">
              <button
                onClick={() => router.push('/builder')}
                className="btn btn-filled state-layer"
              >
                {teams.length >= 1 ? '新しいパーティを作成（上書き）' : '新しいパーティを作成'}
              </button>
            </div>

            {teams.map((team) => (
              <div key={team.id} className="md-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="md-title-large text-on-surface">{team.name}</h2>
                    <p className="md-body-medium text-on-surface-variant mt-1">
                      {team.pokemon.length}体 • {new Date(team.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleEdit(team.id)}
                      className="btn btn-tonal state-layer"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleShare(team)}
                      className="btn btn-outlined state-layer"
                    >
                      共有
                    </button>
                    <button
                      onClick={() => handleDelete(team.id, team.name)}
                      className="btn btn-error state-layer"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* ポケモンリスト */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {team.pokemon.map((pokemon) => (
                    <div key={pokemon.id} className="bg-surface-container rounded-lg p-2 text-center">
                      <div className="md-body-medium font-medium text-on-surface">
                        {pokemon.nickname || pokemon.species}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-1">
                        Lv.{pokemon.level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QRコードモーダル */}
      {showQRModal && shareUrl && (
        <QRCodeDisplay
          url={shareUrl}
          teamName={shareTeamName}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}
