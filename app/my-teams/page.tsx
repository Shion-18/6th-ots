'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '@/types/pokemon';
import { getTeamsFromAPI, deleteTeamFromAPI } from '@/lib/team-storage';
import { generateShareUrl } from '@/lib/team-encoder';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';
import { useToast, ToastContainer } from '@/components/ui/Toast';

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

  const handleShare = (team: Team) => {
    try {
      const url = generateShareUrl(team);
      setShareUrl(url);
      setShareTeamName(team.name);
      setShowQRModal(true);
    } catch (error) {
      console.error('Share failed:', error);
      showToast('error', '共有リンクの作成に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ヘッダー */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">マイパーティ</h1>
              <p className="text-gray-600 mt-1 text-sm">保存済み: {teams.length}/1</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← ホーム
            </button>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500 text-lg mb-4">保存されたパーティがありません</p>
            <button
              onClick={() => router.push('/builder')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
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
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {teams.length >= 1 ? '新しいパーティを作成（上書き）' : '新しいパーティを作成'}
              </button>
            </div>

            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{team.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {team.pokemon.length}体 • {new Date(team.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleEdit(team.id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleShare(team)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      共有
                    </button>
                    <button
                      onClick={() => handleDelete(team.id, team.name)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* ポケモンリスト */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {team.pokemon.map((pokemon) => (
                    <div key={pokemon.id} className="bg-gray-100 rounded-lg p-2 text-center">
                      <div className="font-bold text-sm text-gray-800">
                        {pokemon.nickname || pokemon.species}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
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
