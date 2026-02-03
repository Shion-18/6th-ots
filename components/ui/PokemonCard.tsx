'use client';

import { Pokemon } from '@/types/pokemon';
import { getTypeColor, getTypeBgColor } from '@/lib/type-colors';

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick?: () => void;
  showStats?: boolean;
}

export default function PokemonCard({ pokemon, onClick, showStats = true }: PokemonCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-lg overflow-hidden
        border-4 border-gray-200
        ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}
      `}
    >
      {/* ヘッダー部分 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white font-bold text-xl mb-1">
              {pokemon.nickname || pokemon.species}
            </h3>
            {pokemon.nickname && (
              <p className="text-white/80 text-sm">{pokemon.species}</p>
            )}
          </div>
          <div className="text-white/90 text-sm font-semibold">
            Lv.{pokemon.level}
          </div>
        </div>
      </div>

      {/* メイン情報 */}
      <div className="p-4 space-y-3">
        {/* 性別・特性・持ち物 */}
        <div className="space-y-2">
          {pokemon.gender && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-16">性別</span>
              <span className={`text-sm font-bold ${pokemon.gender === 'オス' ? 'text-blue-600' : 'text-pink-600'}`}>
                {pokemon.gender === 'オス' ? '♂' : '♀'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 w-16">特性</span>
            <span className="text-sm font-bold text-gray-800">{pokemon.ability}</span>
          </div>
          {pokemon.item && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-16">持ち物</span>
              <span className="text-sm font-bold text-purple-600">{pokemon.item}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 w-16">性格</span>
            <span className="text-sm font-bold text-gray-800">{pokemon.nature}</span>
          </div>
        </div>

        {/* 技 */}
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">技</div>
          <div className="grid grid-cols-1 gap-1">
            {pokemon.moves.map((move, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium text-gray-800"
              >
                {move}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
