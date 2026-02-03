// Script to fetch learnable moves for each Gen 6 Pokemon including pre-evolution moves
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

// Cache for move details and evolution chains
const moveCache = new Map<string, MoveDetail>();
const evolutionChainCache = new Map<number, number[]>();
const pokemonMovesCache = new Map<number, Set<string>>();

async function fetchMoveDetail(moveUrl: string): Promise<MoveDetail | null> {
  try {
    if (moveCache.has(moveUrl)) {
      return moveCache.get(moveUrl)!;
    }

    const response = await fetch(moveUrl);
    if (!response.ok) return null;

    const data = await response.json();
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

    moveCache.set(moveUrl, moveDetail);
    return moveDetail;
  } catch (error) {
    console.error(`Error fetching move detail from ${moveUrl}:`, error);
    return null;
  }
}

async function fetchEvolutionChain(pokemonId: number): Promise<number[]> {
  try {
    if (evolutionChainCache.has(pokemonId)) {
      return evolutionChainCache.get(pokemonId)!;
    }

    // Fetch pokemon species to get evolution chain URL
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    if (!speciesResponse.ok) return [pokemonId];

    const speciesData = await speciesResponse.json();
    const evolutionChainUrl = speciesData.evolution_chain.url;

    // Fetch evolution chain
    const chainResponse = await fetch(evolutionChainUrl);
    if (!chainResponse.ok) return [pokemonId];

    const chainData = await chainResponse.json();

    // Extract all Pokemon IDs in the evolution chain
    const chain: number[] = [];

    function extractChain(evolutionData: any) {
      const speciesUrl = evolutionData.species.url;
      const id = parseInt(speciesUrl.split('/').slice(-2)[0]);
      chain.push(id);

      if (evolutionData.evolves_to && evolutionData.evolves_to.length > 0) {
        for (const evolution of evolutionData.evolves_to) {
          extractChain(evolution);
        }
      }
    }

    extractChain(chainData.chain);

    // Cache for all Pokemon in this chain
    for (const id of chain) {
      evolutionChainCache.set(id, chain);
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    return chain;
  } catch (error) {
    console.error(`Error fetching evolution chain for Pokemon #${pokemonId}:`, error);
    return [pokemonId];
  }
}

async function fetchPokemonMovesOnly(pokemonId: number): Promise<Set<string>> {
  try {
    if (pokemonMovesCache.has(pokemonId)) {
      return pokemonMovesCache.get(pokemonId)!;
    }

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    if (!response.ok) return new Set();

    const data = await response.json();
    const moveUrls = new Set<string>();

    for (const moveEntry of data.moves) {
      const gen6Versions = moveEntry.version_group_details.filter(
        (vg: any) => vg.version_group.name === 'x-y' || vg.version_group.name === 'omega-ruby-alpha-sapphire'
      );

      if (gen6Versions.length > 0) {
        moveUrls.add(moveEntry.move.url);
      }
    }

    pokemonMovesCache.set(pokemonId, moveUrls);
    return moveUrls;
  } catch (error) {
    console.error(`Error fetching moves for Pokemon #${pokemonId}:`, error);
    return new Set();
  }
}

async function fetchPokemonMoves(pokemonId: number): Promise<PokemonMoves | null> {
  try {
    console.log(`Processing Pokemon #${pokemonId}...`);

    // Get pokemon name
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    if (!response.ok) return null;
    const data = await response.json();

    // Get evolution chain
    const evolutionChain = await fetchEvolutionChain(pokemonId);
    console.log(`  Evolution chain: ${evolutionChain.join(', ')}`);

    // Get all pre-evolution Pokemon IDs (including itself)
    const preEvolutionIds = evolutionChain.filter(id => id <= pokemonId);

    // Collect moves from this Pokemon and all pre-evolutions
    const allMoveUrls = new Set<string>();

    for (const preEvoId of preEvolutionIds) {
      const moves = await fetchPokemonMovesOnly(preEvoId);
      moves.forEach(url => allMoveUrls.add(url));
    }

    console.log(`  Total moves (including pre-evolutions): ${allMoveUrls.size}`);

    // Fetch details for all moves
    const moves: MoveDetail[] = [];
    for (const moveUrl of Array.from(allMoveUrls)) {
      const moveDetail = await fetchMoveDetail(moveUrl);
      if (moveDetail) {
        moves.push(moveDetail);
      }
      await new Promise(resolve => setTimeout(resolve, 30));
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

    if (id % 25 === 0) {
      console.log(`\nProgress: ${id}/721 Pokemon processed`);
      console.log(`Total unique moves cached: ${moveCache.size}`);
      console.log(`Evolution chains cached: ${evolutionChainCache.size}\n`);
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
