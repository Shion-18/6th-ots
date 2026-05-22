'use client';

import { memo, useMemo } from 'react';
import { Pokemon, PokemonType } from '@/types/pokemon';
import { getPokemonData } from '@/lib/pokemon-data';
import { getTypeBgColor } from '@/lib/type-colors';

interface PokemonCompactCardProps {
  pokemon: Pokemon;
}

/**
 * 画像エクスポート（html2canvas）用のコンパクトカード。
 *
 * 画面表示用の {@link CompactPokemonCard} とは視覚設計を分けている:
 * - 横並び・大きめスプライト・大きめフォント（1200px の PNG 向け）
 * - html2canvas が Next.js `<Image>` の内部 src 解決で崩れるのを避けるため
 *   ここではあえて raw `<img>` を使う
 */
function PokemonCompactCardInner({ pokemon }: PokemonCompactCardProps) {
  const pokemonData = useMemo(
    () => getPokemonData(pokemon.speciesId),
    [pokemon.speciesId]
  );

  const sprite = pokemonData?.sprite ?? '';
  const types = pokemonData?.types ?? [];

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex gap-4">
      {/* 左側: ポケモン画像（raw <img> は html2canvas 互換性のため意図的） */}
      <div className="flex-shrink-0 w-20 h-20">
        {sprite && (
          // eslint-disable-next-line @next/next/no-img-element
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
              className={`text-xs px-2 py-0.5 rounded text-white font-medium ${getTypeBgColor(
                type as PokemonType
              )}`}
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
          {pokemon.moves.map((move) => (
            <div key={move}>・{move}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(PokemonCompactCardInner);
