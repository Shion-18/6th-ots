// Script to fetch learnable moves for each Gen 6 Pokemon from PokeAPI
// This will create a mapping of Pokemon ID to their learnable moves with Japanese names

import { writeFileSync } from 'fs';
import { join } from 'path';

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

interface PokemonMoves {
  pokemonId: number;
  pokemonName: string;
  moves: MoveDetail[];
}

const TYPE_MAP: { [key: string]: string } = {
  normal: 'ノーマル',
  fire: 'ほのお',
  water: 'みず',
  electric: 'でんき',
  grass: 'くさ',
  ice: 'こおり',
  fighting: 'かくとう',
  poison: 'どく',
  ground: 'じめん',
  flying: 'ひこう',
  psychic: 'エスパー',
  bug: 'むし',
  rock: 'いわ',
  ghost: 'ゴースト',
  dragon: 'ドラゴン',
  dark: 'あく',
  steel: 'はがね',
  fairy: 'フェアリー',
};

const CATEGORY_MAP: { [key: string]: string } = {
  physical: '物理',
  special: '特殊',
  status: '変化',
};

// Cache for move details to avoid duplicate API calls
const moveCache = new Map<string, MoveDetail>();

async function fetchMoveDetail(moveUrl: string): Promise<MoveDetail | null> {
  try {
    // Check cache first
    if (moveCache.has(moveUrl)) {
      return moveCache.get(moveUrl)!;
    }

    const response = await fetch(moveUrl);
    if (!response.ok) return null;

    const data = await response.json();

    // Get Japanese name
    const japaneseName = data.names.find((n: any) => n.language.name === 'ja')?.name || data.name;

    const moveDetail: MoveDetail = {
      id: data.id,
      name: data.name,
      nameJa: japaneseName,
      type: TYPE_MAP[data.type.name] || data.type.name,
      category: CATEGORY_MAP[data.damage_class.name] || data.damage_class.name,
      power: data.power,
      accuracy: data.accuracy,
      pp: data.pp,
    };

    // Cache the result
    moveCache.set(moveUrl, moveDetail);

    return moveDetail;
  } catch (error) {
    console.error(`Error fetching move detail from ${moveUrl}:`, error);
    return null;
  }
}

async function fetchPokemonMoves(pokemonId: number): Promise<PokemonMoves | null> {
  try {
    console.log(`Fetching moves for Pokemon #${pokemonId}...`);

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    if (!response.ok) return null;

    const data = await response.json();

    // Get all unique moves (excluding moves learned only in later generations)
    const moveUrls = new Set<string>();

    for (const moveEntry of data.moves) {
      // Filter for Gen 6 (X/Y = version-group-id 15, ORAS = version-group-id 16)
      const gen6Versions = moveEntry.version_group_details.filter(
        (vg: any) => vg.version_group.name === 'x-y' || vg.version_group.name === 'omega-ruby-alpha-sapphire'
      );

      if (gen6Versions.length > 0) {
        moveUrls.add(moveEntry.move.url);
      }
    }

    // Fetch details for all moves
    const moves: MoveDetail[] = [];
    for (const moveUrl of Array.from(moveUrls)) {
      const moveDetail = await fetchMoveDetail(moveUrl);
      if (moveDetail) {
        moves.push(moveDetail);
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Sort moves by Japanese name
    moves.sort((a, b) => a.nameJa.localeCompare(b.nameJa, 'ja'));

    return {
      pokemonId,
      pokemonName: data.name,
      moves,
    };
  } catch (error) {
    console.error(`Error fetching Pokemon #${pokemonId}:`, error);
    return null;
  }
}

async function fetchAllPokemonMoves() {
  const allPokemonMoves: PokemonMoves[] = [];

  // Gen 6 includes Pokemon #1-721
  for (let id = 1; id <= 721; id++) {
    const pokemonMoves = await fetchPokemonMoves(id);
    if (pokemonMoves) {
      allPokemonMoves.push(pokemonMoves);
    }

    // Progress update every 25 Pokemon
    if (id % 25 === 0) {
      console.log(`Progress: ${id}/721 Pokemon processed`);
      console.log(`Total moves cached: ${moveCache.size}`);
    }
  }

  // Save to file
  const outputPath = join(process.cwd(), 'data', 'pokemon-moves.json');
  writeFileSync(outputPath, JSON.stringify(allPokemonMoves, null, 2), 'utf-8');

  console.log(`\nSuccessfully fetched moves for ${allPokemonMoves.length} Pokemon!`);
  console.log(`Total unique moves: ${moveCache.size}`);
  console.log(`Data saved to: ${outputPath}`);
}

// Run the script
fetchAllPokemonMoves().catch(console.error);
