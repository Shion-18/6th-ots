// Script to fetch all Gen 6 Pokemon data from PokeAPI
// Generation 6 (X/Y/ORAS) includes Pokemon #1-721

import { writeFileSync } from 'fs';
import { join } from 'path';

interface PokemonData {
  id: number;
  name: string;
  nameEn: string;
  nameJa: string;
  sprite: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  abilities: string[];
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

async function fetchPokemonSpecies(id: number): Promise<{ nameJa: string }> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  const data = await response.json();

  const japaneseName = data.names.find((n: any) => n.language.name === 'ja')?.name || '';

  return { nameJa: japaneseName };
}

async function fetchPokemon(id: number): Promise<PokemonData | null> {
  try {
    console.log(`Fetching Pokemon #${id}...`);

    // Fetch main Pokemon data
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) return null;

    const data = await response.json();

    // Fetch species data for Japanese name
    const speciesData = await fetchPokemonSpecies(id);

    const pokemonData: PokemonData = {
      id: data.id,
      name: data.name,
      nameEn: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      nameJa: speciesData.nameJa,
      sprite: data.sprites.front_default || '',
      types: data.types.map((t: any) => TYPE_MAP[t.type.name] || t.type.name),
      baseStats: {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        spAttack: data.stats[3].base_stat,
        spDefense: data.stats[4].base_stat,
        speed: data.stats[5].base_stat,
      },
      abilities: data.abilities.map((a: any) => a.ability.name),
    };

    return pokemonData;
  } catch (error) {
    console.error(`Error fetching Pokemon #${id}:`, error);
    return null;
  }
}

async function fetchAllGen6Pokemon() {
  const allPokemon: PokemonData[] = [];

  // Gen 6 includes Pokemon #1-721
  for (let id = 1; id <= 721; id++) {
    const pokemon = await fetchPokemon(id);
    if (pokemon) {
      allPokemon.push(pokemon);
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    // Progress update every 50 Pokemon
    if (id % 50 === 0) {
      console.log(`Progress: ${id}/721 Pokemon fetched`);
    }
  }

  // Save to file
  const outputPath = join(process.cwd(), 'data', 'all-pokemon.json');
  writeFileSync(outputPath, JSON.stringify(allPokemon, null, 2), 'utf-8');

  console.log(`\nSuccessfully fetched ${allPokemon.length} Pokemon!`);
  console.log(`Data saved to: ${outputPath}`);
}

// Run the script
fetchAllGen6Pokemon().catch(console.error);
