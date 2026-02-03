'use client';

import { Pokemon } from '@/types/pokemon';
import allPokemon from '@/data/all-pokemon.json';

interface PokemonCompactCardProps {
  pokemon: Pokemon;
}

interface PokemonData {
  id: number;
  name: string;
  nameJa: string;
  sprite: string;
  types: string[];
}

export default function PokemonCompactCard({ pokemon }: PokemonCompactCardProps) {
  // ポケモンデータを取得
  const pokemonData = (allPokemon as PokemonData[]).find(
    (p) => p.id === pokemon.speciesId
  );

  const sprite = pokemonData?.sprite || '';
  const types = pokemonData?.types || [];

  // タイプカラーマッピング
  const typeColors: { [key: string]: string } = {
    'ノーマル': 'bg-gray-400',
    'ほのお': 'bg-red-500',
    'みず': 'bg-blue-500',
    'でんき': 'bg-yellow-400',
    'くさ': 'bg-green-500',
    'こおり': 'bg-cyan-400',
    'かくとう': 'bg-orange-600',
    'どく': 'bg-purple-500',
    'じめん': 'bg-yellow-600',
    'ひこう': 'bg-indigo-400',
    'エスパー': 'bg-pink-500',
    'むし': 'bg-lime-500',
    'いわ': 'bg-yellow-700',
    'ゴースト': 'bg-purple-700',
    'ドラゴン': 'bg-indigo-600',
    'あく': 'bg-gray-700',
    'はがね': 'bg-gray-500',
    'フェアリー': 'bg-pink-400',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex gap-4">
      {/* 左側: ポケモン画像 */}
      <div className="flex-shrink-0 w-20 h-20">
        {sprite && (
          <img
            src={sprite}
            alt={pokemon.species}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* 右側: 情報 */}
      <div className="flex-1 space-y-1">
        {/* 名前とレベル */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-800">
            {pokemon.nickname || pokemon.species}
          </h3>
          <span className="text-sm font-semibold text-gray-600">
            Lv.{pokemon.level}
          </span>
        </div>

        {/* タイプバッジ */}
        <div className="flex gap-1">
          {types.map((type) => (
            <span
              key={type}
              className={`text-xs px-2 py-0.5 rounded text-white font-medium ${
                typeColors[type] || 'bg-gray-400'
              }`}
            >
              {type}
            </span>
          ))}
        </div>

        {/* 特性 */}
        <div className="text-sm text-gray-700">
          <span className="font-semibold">特性:</span> {pokemon.ability}
        </div>

        {/* 持ち物 */}
        {pokemon.item && (
          <div className="text-sm text-gray-700">
            <span className="font-semibold">持ち物:</span> {pokemon.item}
          </div>
        )}

        {/* 技 */}
        <div className="text-sm text-gray-700">
          {pokemon.moves.map((move, index) => (
            <div key={index}>・{move}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
