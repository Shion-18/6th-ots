import { NextRequest, NextResponse } from 'next/server';
import pokemonMovesData from '@/data/pokemon-moves.json';
import { expandHiddenPower, type MoveDetail } from '@/lib/hidden-power';

interface PokemonMovesEntry {
  pokemonId: number;
  pokemonName: string;
  moves: MoveDetail[];
}

// Build lookup map once at module level (server-side only)
const movesMap = new Map<number, MoveDetail[]>();
for (const entry of pokemonMovesData as PokemonMovesEntry[]) {
  // めざめるパワーはタイプ別16種に展開して返す
  movesMap.set(entry.pokemonId, expandHiddenPower(entry.moves));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ species: string }> }
) {
  const { species } = await params;
  const pokemonId = parseInt(species, 10);

  // 通常種は 1〜721、フォーム違い(ニャオニクス♀やロトム各種など)は 10000番台。
  if (isNaN(pokemonId) || pokemonId < 1 || pokemonId > 100000) {
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
