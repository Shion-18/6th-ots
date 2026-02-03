// Script to update abilities in all-pokemon.json to Japanese names
import { readFileSync, writeFileSync } from 'fs';
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

// Cache for ability translations
const abilityCache = new Map<string, string>();

async function fetchAbilityJapaneseName(abilityName: string): Promise<string> {
  try {
    // Check cache first
    if (abilityCache.has(abilityName)) {
      return abilityCache.get(abilityName)!;
    }

    console.log(`Fetching Japanese name for ability: ${abilityName}`);

    const response = await fetch(`https://pokeapi.co/api/v2/ability/${abilityName}`);
    if (!response.ok) {
      console.warn(`Failed to fetch ability: ${abilityName}`);
      return abilityName; // Return original if fetch fails
    }

    const data = await response.json();
    const japaneseName = data.names.find((n: any) => n.language.name === 'ja')?.name || abilityName;

    // Cache the result
    abilityCache.set(abilityName, japaneseName);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    return japaneseName;
  } catch (error) {
    console.error(`Error fetching ability ${abilityName}:`, error);
    return abilityName;
  }
}

async function updateAbilitiesToJapanese() {
  // Read current data
  const dataPath = join(process.cwd(), 'data', 'all-pokemon.json');
  const pokemonData: PokemonData[] = JSON.parse(readFileSync(dataPath, 'utf-8'));

  console.log(`Updating abilities for ${pokemonData.length} Pokemon...`);

  // Collect all unique abilities
  const uniqueAbilities = new Set<string>();
  for (const pokemon of pokemonData) {
    for (const ability of pokemon.abilities) {
      uniqueAbilities.add(ability);
    }
  }

  console.log(`Found ${uniqueAbilities.size} unique abilities`);

  // Fetch Japanese names for all abilities
  for (const ability of Array.from(uniqueAbilities)) {
    await fetchAbilityJapaneseName(ability);
  }

  // Update all Pokemon data
  for (const pokemon of pokemonData) {
    pokemon.abilities = await Promise.all(
      pokemon.abilities.map(ability => fetchAbilityJapaneseName(ability))
    );
  }

  // Save updated data
  writeFileSync(dataPath, JSON.stringify(pokemonData, null, 2), 'utf-8');

  console.log(`\nSuccessfully updated all abilities to Japanese!`);
  console.log(`Total unique abilities: ${abilityCache.size}`);
  console.log(`Data saved to: ${dataPath}`);
}

// Run the script
updateAbilitiesToJapanese().catch(console.error);
