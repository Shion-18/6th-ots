'use client';

import { Team } from '@/types/pokemon';
import PokemonCompactCard from './PokemonCompactCard';

interface TeamImageViewProps {
  team: Team;
  elementRef: React.RefObject<HTMLDivElement | null>;
}

export default function TeamImageView({ team, elementRef }: TeamImageViewProps) {
  return (
    <div
      ref={elementRef}
      className="w-[1200px] bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-8"
    >
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{team.name}</h1>
        <div className="flex gap-4 text-white text-sm opacity-80">
          <span>
            {team.format === 'singles' ? 'シングルバトル' : 'ダブルバトル'}
          </span>
          <span>•</span>
          <span>{team.pokemon.length}体</span>
          <span>•</span>
          <span>ID: {team.id}</span>
        </div>
      </div>

      {/* ポケモングリッド */}
      <div className="grid grid-cols-2 gap-4">
        {team.pokemon.map((pokemon) => (
          <PokemonCompactCard key={pokemon.id} pokemon={pokemon} />
        ))}
      </div>
    </div>
  );
}
