'use client';

import { Pokemon } from '@/types/pokemon';
import TypeIcon from './TypeIcon';
import { getMoveType } from '@/lib/move-helpers';
import allPokemon from '@/data/all-pokemon.json';
import Image from 'next/image';

interface PokemonData {
  id: number;
  name: string;
  nameJa: string;
  sprite: string;
  types: string[];
}

interface CompactPokemonCardProps {
  pokemon: Pokemon;
}

export default function CompactPokemonCard({ pokemon }: CompactPokemonCardProps) {
  // Find Pokemon data by speciesId
  const pokemonData = (allPokemon as PokemonData[]).find((p) => p.id === pokemon.speciesId);

  if (!pokemonData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 h-[180px] sm:h-[200px] flex items-center justify-center">
        <p className="text-gray-500 text-sm">ポケモンデータが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden h-[180px] sm:h-[200px]">
      <div className="flex h-full">
        {/* Left: Pokemon Image */}
        <div className="flex-shrink-0 w-20 sm:w-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Image
            src={pokemonData.sprite}
            alt={pokemon.species}
            width={70}
            height={70}
            className="pixelated"
          />
        </div>

        {/* Right: Pokemon Info */}
        <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between min-w-0">
          {/* Top: Name, Level, Types */}
          <div>
            <div className="flex items-start justify-between gap-1 mb-1">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                  {pokemon.nickname || pokemon.species}
                </h3>
                {pokemon.nickname && (
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">{pokemon.species}</p>
                )}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">
                Lv.{pokemon.level}
              </span>
            </div>

            {/* Types */}
            <div className="flex gap-1 mb-2">
              {pokemonData.types.map((type) => (
                <TypeIcon key={type} type={type} size="xs" />
              ))}
            </div>

            {/* Details: Ability, Item */}
            <div className="space-y-0.5 text-[10px] sm:text-xs">
              <div className="flex gap-1">
                <span className="text-gray-500 font-medium">特性:</span>
                <span className="text-gray-800 font-semibold truncate">{pokemon.ability}</span>
              </div>
              {pokemon.item && (
                <div className="flex gap-1">
                  <span className="text-gray-500 font-medium">持物:</span>
                  <span className="text-purple-600 font-semibold truncate">{pokemon.item}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Moves */}
          <div className="grid grid-cols-2 gap-1">
            {pokemon.moves.slice(0, 4).map((move, index) => {
              const moveType = getMoveType(move);
              return (
                <div key={index} className="flex items-center gap-1 min-w-0">
                  <span className="text-gray-700 text-[10px]">•</span>
                  <span className="text-[10px] sm:text-xs text-gray-800 truncate flex-1">
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
  );
}
