import { NextRequest, NextResponse } from 'next/server';
import pokemonMovesData from '@/data/pokemon-moves.json';

interface MoveDetail {
  id: number;
  name: string;
  nameJa: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

interface PokemonMovesEntry {
  pokemonId: number;
  pokemonName: string;
  moves: MoveDetail[];
}

// Build lookup map once at module level (server-side only)
const movesMap = new Map<number, MoveDetail[]>();
for (const entry of pokemonMovesData as PokemonMovesEntry[]) {
  movesMap.set(entry.pokemonId, entry.moves);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ species: string }> }
) {
  const { species } = await params;
  const pokemonId = parseInt(species, 10);

  if (isNaN(pokemonId) || pokemonId < 1 || pokemonId > 10000) {
    return NextResponse.json({ error: 'Invalid species ID' }, { status: 400 });
  }

  const moves = movesMap.get(pokemonId) || [];

  return NextResponse.json(
    { moves },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
