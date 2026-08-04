'use client';

import { memo } from 'react';
import { Pokemon } from '@/types/pokemon';
import TypeIcon from './TypeIcon';
import { getMoveType } from '@/lib/move-helpers';
import { getPokemonData } from '@/lib/pokemon-data';
import Image from 'next/image';

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick?: () => void;
}

// チャンピオンズのオープンチームシート風レイアウト:
// スプライト左 + 技4段（全幅・省略なし）、下部に特性/性格/持ち物のラベル付きグリッド
function PokemonCardInner({ pokemon, onClick }: PokemonCardProps) {
  const pokemonData = getPokemonData(pokemon.speciesId);

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
      {/* ヘッダー: 名前・性別 | タイプ・Lv */}
      <div className="bg-primary px-3 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-on-primary md-title-medium truncate leading-tight">
            {pokemon.nickname || pokemon.species}
            {(pokemon.gender === 'オス' || pokemon.gender === 'メス') && (
              <span className={`ml-1 font-bold ${pokemon.gender === 'オス' ? 'text-blue-300' : 'text-pink-300'}`}>
                {pokemon.gender === 'オス' ? '♂' : '♀'}
              </span>
            )}
          </h3>
          {pokemon.nickname && (
            <p className="text-on-primary/80 text-[10px] truncate">{pokemon.species}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {pokemonData.types.map((type) => (
            <TypeIcon key={type} type={type} size="xs" />
          ))}
          <span className="text-on-primary/90 text-xs font-medium whitespace-nowrap ml-1">
            Lv.{pokemon.level}
          </span>
        </div>
      </div>

      {/* 上段: スプライト左 + 技4段 */}
      <div className="flex items-center gap-2 p-2">
        <div className="flex-shrink-0 w-20 sm:w-24 self-center bg-surface-container rounded-lg flex items-center justify-center">
          <Image
            src={pokemonData.sprite}
            alt={pokemon.species}
            width={80}
            height={80}
            className="pixelated"
          />
        </div>
        <ul className="flex-1 min-w-0 flex flex-col gap-1">
          {Array.from({ length: 4 }).map((_, index) => {
            const move = pokemon.moves[index];
            const moveType = move ? getMoveType(move) : null;
            return (
              <li
                key={index}
                className="flex items-center justify-between gap-2 bg-surface-container rounded-md px-2 py-1 min-h-[26px]"
              >
                {move ? (
                  <>
                    <span className="text-xs sm:text-sm font-medium text-on-surface whitespace-nowrap">
                      {move}
                    </span>
                    {moveType && (
                      <TypeIcon type={moveType} size="xs" className="flex-shrink-0" />
                    )}
                  </>
                ) : (
                  <span className="text-xs text-on-surface-variant">—</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 下段: 特性・性格・持ち物 */}
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 px-3 pb-2.5 items-baseline">
        <span className="text-[10px] text-on-surface-variant">特性</span>
        <span className="text-xs font-medium text-on-surface">{pokemon.ability}</span>
        <span className="text-[10px] text-on-surface-variant">性格</span>
        <span className="text-xs font-medium text-on-surface">{pokemon.nature || '—'}</span>
        <span className="text-[10px] text-on-surface-variant">持ち物</span>
        <span className="text-xs font-medium text-primary">{pokemon.item || '—'}</span>
      </div>
    </div>
  );
}

export default memo(PokemonCardInner);
