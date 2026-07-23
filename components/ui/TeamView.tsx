'use client';

import { Team } from '@/types/pokemon';
import CompactPokemonCard from './CompactPokemonCard';

interface TeamViewProps {
  team: Team;
  onShare?: () => void;
}

export default function TeamView({ team, onShare }: TeamViewProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top app bar */}
      <div className="bg-surface elevation-2 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="md-title-large text-on-surface">{team.name}</h1>
              <p className="md-body-medium text-on-surface-variant mt-1">
                {team.pokemon.length}体
              </p>
            </div>
            {onShare && (
              <button
                onClick={onShare}
                className="btn btn-filled state-layer"
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
            <p className="md-body-large text-on-surface-variant">ポケモンが登録されていません</p>
          </div>
        )}
      </div>
    </div>
  );
}
