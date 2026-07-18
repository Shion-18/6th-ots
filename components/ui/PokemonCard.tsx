'use client';

import { memo, useMemo } from 'react';
import { Pokemon } from '@/types/pokemon';
import TypeIcon from './TypeIcon';
import { getMoveType } from '@/lib/move-helpers';
import allPokemon from '@/data/all-pokemon.json';
import Image from 'next/image';

interface PokemonData {
  id: number;
  nameJa: string;
  sprite: string;
  types: string[];
}

// O(1) lookup instead of O(n) .find()
const pokemonLookup = new Map<number, PokemonData>(
  (allPokemon as PokemonData[]).map(p => [p.id, p])
);

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick?: () => void;
}

function PokemonCardInner({ pokemon, onClick }: PokemonCardProps) {
  const pokemonData = useMemo(
    () => pokemonLookup.get(pokemon.speciesId),
    [pokemon.speciesId]
  );

  if (!pokemonData) {
    return (
      <div className="md-card p-4 flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">ポケモンデータが見つかりません</p>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        md-card overflow-hidden
        ${onClick ? 'cursor-pointer state-layer' : ''}
      `}
    >
      <div className="flex">
        {/* 左: ポケモン画像 */}
        <div className="flex-shrink-0 w-24 sm:w-28 bg-surface-container flex items-center justify-center">
          <Image
            src={pokemonData.sprite}
            alt={pokemon.species}
            width={90}
            height={90}
            className="pixelated"
          />
        </div>

        {/* 右: 情報セクション */}
        <div className="flex-1 flex flex-col">
          {/* ヘッダー */}
          <div className="bg-primary p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-on-primary md-title-medium truncate">
                  {pokemon.nickname || pokemon.species}
                </h3>
                {pokemon.nickname && (
                  <p className="text-on-primary/80 text-xs truncate">{pokemon.species}</p>
                )}
              </div>
              <div className="text-on-primary/90 text-sm font-medium ml-2 whitespace-nowrap">
                Lv.{pokemon.level}
              </div>
            </div>

            {/* タイプアイコン */}
            <div className="flex gap-1">
              {pokemonData.types.map((type, index) => (
                <TypeIcon key={index} type={type} size="xs" />
              ))}
            </div>
          </div>

          {/* メイン情報 */}
          <div className="p-3 space-y-2 flex-1">
            {/* 性別・特性・持ち物（ラベルなし） */}
            <div className="space-y-1.5 text-sm">
              {/* 性別 */}
              {pokemon.gender && (
                <div className="flex items-center">
                  <span className={`font-bold ${pokemon.gender === 'オス' ? 'text-blue-600' : 'text-pink-600'}`}>
                    {pokemon.gender === 'オス' ? '♂' : '♀'}
                  </span>
                </div>
              )}

              {/* 特性（ラベルなし） */}
              <div className="text-on-surface font-medium">
                {pokemon.ability}
              </div>

              {/* 持ち物（ラベルなし） */}
              {pokemon.item && (
                <div className="text-primary font-medium">
                  {pokemon.item}
                </div>
              )}
            </div>

            {/* 技（ラベルなし、タイプアイコン付き） */}
            <div className="grid grid-cols-2 gap-1.5 pt-2">
              {pokemon.moves.map((move, index) => {
                const moveType = getMoveType(move);
                return (
                  <div key={index} className="flex items-center gap-1 min-w-0">
                    <span className="text-xs text-on-surface truncate flex-1 font-medium">
                      {move}
                    </span>
                    {moveType && (
                      <TypeIcon type={moveType} size="xs" className="flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PokemonCardInner);
