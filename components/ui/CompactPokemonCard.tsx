'use client';

import { memo, useMemo } from 'react';
import { Pokemon } from '@/types/pokemon';
import TypeIcon from './TypeIcon';
import { getMoveType } from '@/lib/move-helpers';
import { getPokemonData } from '@/lib/pokemon-data';
import Image from 'next/image';

interface CompactPokemonCardProps {
  pokemon: Pokemon;
}

function CompactPokemonCardInner({ pokemon }: CompactPokemonCardProps) {
  const pokemonData = useMemo(
    () => getPokemonData(pokemon.speciesId),
    [pokemon.speciesId]
  );

  if (!pokemonData) {
    return (
      <div className="md-card p-3 flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">ポケモンデータが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="md-card overflow-hidden p-2">
      {/* Row 1: Sprite + Name + Level */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="flex-shrink-0 w-10 h-10 bg-surface-container rounded flex items-center justify-center">
          <Image
            src={pokemonData.sprite}
            alt={pokemon.species}
            width={36}
            height={36}
            className="pixelated"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-on-surface leading-tight">
            {pokemon.nickname || pokemon.species}
            {(pokemon.gender === 'オス' || pokemon.gender === 'メス') && (
              <span
                className={`ml-1 ${pokemon.gender === 'オス' ? 'text-blue-600' : 'text-pink-600'}`}
                aria-label={pokemon.gender}
              >
                {pokemon.gender === 'オス' ? '♂' : '♀'}
              </span>
            )}
          </h3>
          {pokemon.nickname && (
            <p className="text-[9px] text-on-surface-variant leading-tight">{pokemon.species}</p>
          )}
        </div>
        <span className="text-[10px] font-medium text-on-surface-variant whitespace-nowrap">
          Lv.{pokemon.level}
        </span>
      </div>

      {/* Row 2: Types */}
      <div className="flex gap-0.5 mb-1">
        {pokemonData.types.map((type) => (
          <TypeIcon key={type} type={type} size="xs" />
        ))}
      </div>

      {/* Row 3-4: Ability, Item */}
      <div className="space-y-0 text-[10px] mb-1">
        <div className="flex gap-1">
          <span className="text-on-surface font-medium">{pokemon.ability}</span>
        </div>
        {pokemon.item && (
          <div className="flex gap-1">
            <span className="text-primary font-medium">{pokemon.item}</span>
          </div>
        )}
      </div>

      {/* Moves (vertical single column) */}
      <div className="flex flex-col gap-0">
        {pokemon.moves.slice(0, 4).map((move, index) => {
          const moveType = getMoveType(move);
          return (
            <div key={index} className="flex items-center gap-1 min-w-0">
              {moveType && (
                <TypeIcon type={moveType} size="xs" className="flex-shrink-0" />
              )}
              <span className="text-[10px] text-on-surface leading-tight whitespace-nowrap">
                {move}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(CompactPokemonCardInner);
