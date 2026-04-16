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
      <div className="bg-white rounded-xl shadow-md p-3 flex items-center justify-center">
        <p className="text-gray-500 text-sm">ポケモンデータが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden p-2">
      {/* Row 1: Sprite + Name + Level */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
          <Image
            src={pokemonData.sprite}
            alt={pokemon.species}
            width={36}
            height={36}
            className="pixelated"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-gray-800 leading-tight">
            {pokemon.nickname || pokemon.species}
          </h3>
          {pokemon.nickname && (
            <p className="text-[9px] text-gray-500 leading-tight">{pokemon.species}</p>
          )}
        </div>
        <span className="text-[10px] font-semibold text-gray-600 whitespace-nowrap">
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
          <span className="text-gray-500 font-medium flex-shrink-0">特:</span>
          <span className="text-gray-800 font-semibold">{pokemon.ability}</span>
        </div>
        {pokemon.item && (
          <div className="flex gap-1">
            <span className="text-gray-500 font-medium flex-shrink-0">持:</span>
            <span className="text-purple-600 font-semibold">{pokemon.item}</span>
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
              <span className="text-[10px] text-gray-800 leading-tight whitespace-nowrap">
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
