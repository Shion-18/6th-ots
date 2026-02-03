'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '@/types/pokemon';
import { getTeamsFromLocalStorage, deleteTeamFromLocalStorage, generateShareUrl } from '@/lib/team-encoder';

export default function MyTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    setTeams(getTeamsFromLocalStorage());
  }, []);

  const handleDelete = (teamId: string, teamName: string) => {
    if (confirm(`「${teamName}」を削除しますか？`)) {
      deleteTeamFromLocalStorage(teamId);
      setTeams(getTeamsFromLocalStorage());
    }
  };

  const handleEdit = (teamId: string) => {
    router.push(`/builder?teamId=${teamId}`);
  };

  const handleShare = (team: Team) => {
    const shareUrl = generateShareUrl(team);
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('共有URLをコピーしました！\n\n相手にこのURLを送ってください。');
    }).catch(() => {
      alert('URLのコピーに失敗しました');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
        {teams.length === 0 ? (
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
                  <div className="flex gap-2">
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
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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
    </div>
  );
}
