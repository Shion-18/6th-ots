'use client';

import { Team } from '@/types/pokemon';
import CompactPokemonCard from './CompactPokemonCard';

interface TeamViewProps {
  team: Team;
  onShare?: () => void;
}

export default function TeamView({ team, onShare }: TeamViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">{team.name}</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {team.format === 'singles' ? 'シングルバトル' : 'ダブルバトル'} • {team.pokemon.length}体
              </p>
            </div>
            {onShare && (
              <button
                onClick={onShare}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                共有
              </button>
            )}
          </div>
        </div>
      </div>

      {/* パーティリスト */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {team.pokemon.map((pokemon) => (
            <CompactPokemonCard key={pokemon.id} pokemon={pokemon} />
          ))}
        </div>

        {team.pokemon.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">ポケモンが登録されていません</p>
          </div>
        )}
      </div>
    </div>
  );
}
