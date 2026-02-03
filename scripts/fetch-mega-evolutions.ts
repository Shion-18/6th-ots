// Script to fetch Mega Evolution Pokemon from PokeAPI (up to ORAS, excluding Z-A)
import { writeFileSync, readFileSync } from 'fs';
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
  megaOf?: number; // ID of the base Pokemon
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

// Mega Evolution IDs up to ORAS (10001-10046)
// Excluding Z-A megas (Mega Flygon, etc. which don't exist yet)
const MEGA_IDS = [
  10003, // Venusaur
  10004, // Charizard X
  10005, // Charizard Y
  10006, // Blastoise
  10007, // Alakazam
  10008, // Gengar
  10009, // Kangaskhan
  10010, // Pinsir
  10011, // Gyarados
  10012, // Aerodactyl
  10013, // Mewtwo X
  10014, // Mewtwo Y
  10015, // Ampharos
  10016, // Scizor
  10017, // Heracross
  10018, // Houndoom
  10019, // Tyranitar
  10020, // Blaziken
  10021, // Gardevoir
  10022, // Mawile
  10023, // Aggron
  10024, // Medicham
  10025, // Manectric
  10026, // Banette
  10027, // Absol
  10028, // Garchomp
  10029, // Lucario
  10030, // Abomasnow
  10031, // Beedrill
  10032, // Pidgeot
  10033, // Slowbro
  10034, // Steelix
  10035, // Sceptile
  10036, // Swampert
  10037, // Sableye
  10038, // Sharpedo
  10039, // Camerupt
  10040, // Altaria
  10041, // Glalie
  10042, // Salamence
  10043, // Metagross
  10044, // Latias
  10045, // Latios
  10046, // Rayquaza
  10047, // Lopunny
  10048, // Gallade
  10049, // Audino
  10050, // Diancie
];

// Mapping of Mega ID to base Pokemon ID
const MEGA_TO_BASE: { [key: number]: number } = {
  10003: 3,   // Mega Venusaur -> Venusaur
  10004: 6,   // Mega Charizard X -> Charizard
  10005: 6,   // Mega Charizard Y -> Charizard
  10006: 9,   // Mega Blastoise -> Blastoise
  10007: 65,  // Mega Alakazam -> Alakazam
  10008: 94,  // Mega Gengar -> Gengar
  10009: 115, // Mega Kangaskhan -> Kangaskhan
  10010: 127, // Mega Pinsir -> Pinsir
  10011: 130, // Mega Gyarados -> Gyarados
  10012: 142, // Mega Aerodactyl -> Aerodactyl
  10013: 150, // Mega Mewtwo X -> Mewtwo
  10014: 150, // Mega Mewtwo Y -> Mewtwo
  10015: 181, // Mega Ampharos -> Ampharos
  10016: 212, // Mega Scizor -> Scizor
  10017: 214, // Mega Heracross -> Heracross
  10018: 229, // Mega Houndoom -> Houndoom
  10019: 248, // Mega Tyranitar -> Tyranitar
  10020: 257, // Mega Blaziken -> Blaziken
  10021: 282, // Mega Gardevoir -> Gardevoir
  10022: 303, // Mega Mawile -> Mawile
  10023: 306, // Mega Aggron -> Aggron
  10024: 308, // Mega Medicham -> Medicham
  10025: 310, // Mega Manectric -> Manectric
  10026: 354, // Mega Banette -> Banette
  10027: 359, // Mega Absol -> Absol
  10028: 445, // Mega Garchomp -> Garchomp
  10029: 448, // Mega Lucario -> Lucario
  10030: 460, // Mega Abomasnow -> Abomasnow
  10031: 15,  // Mega Beedrill -> Beedrill
  10032: 18,  // Mega Pidgeot -> Pidgeot
  10033: 80,  // Mega Slowbro -> Slowbro
  10034: 208, // Mega Steelix -> Steelix
  10035: 254, // Mega Sceptile -> Sceptile
  10036: 260, // Mega Swampert -> Swampert
  10037: 302, // Mega Sableye -> Sableye
  10038: 319, // Mega Sharpedo -> Sharpedo
  10039: 323, // Mega Camerupt -> Camerupt
  10040: 334, // Mega Altaria -> Altaria
  10041: 362, // Mega Glalie -> Glalie
  10042: 373, // Mega Salamence -> Salamence
  10043: 376, // Mega Metagross -> Metagross
  10044: 380, // Mega Latias -> Latias
  10045: 381, // Mega Latios -> Latios
  10046: 384, // Mega Rayquaza -> Rayquaza
  10047: 428, // Mega Lopunny -> Lopunny
  10048: 475, // Mega Gallade -> Gallade
  10049: 531, // Mega Audino -> Audino
  10050: 719, // Mega Diancie -> Diancie
};

async function fetchAbilityJapaneseName(abilityName: string): Promise<string> {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/ability/${abilityName}`);
    if (!response.ok) return abilityName;

    const data = await response.json();
    const japaneseName = data.names.find((n: any) => n.language.name === 'ja')?.name || abilityName;

    await new Promise(resolve => setTimeout(resolve, 50));
    return japaneseName;
  } catch (error) {
    return abilityName;
  }
}

async function fetchMegaPokemon(id: number): Promise<PokemonData | null> {
  try {
    console.log(`Fetching Mega Pokemon #${id}...`);

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) return null;

    const data = await response.json();

    // Fetch species data for Japanese name
    const speciesResponse = await fetch(data.species.url);
    const speciesData = await speciesResponse.json();
    const japaneseName = speciesData.names.find((n: any) => n.language.name === 'ja')?.name || data.name;

    // Fetch Japanese ability names
    const abilities: string[] = [];
    for (const abilityEntry of data.abilities) {
      const jaAbility = await fetchAbilityJapaneseName(abilityEntry.ability.name);
      abilities.push(jaAbility);
    }

    const pokemonData: PokemonData = {
      id: data.id,
      name: data.name,
      nameEn: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      nameJa: japaneseName,
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
      abilities,
      megaOf: MEGA_TO_BASE[id],
    };

    return pokemonData;
  } catch (error) {
    console.error(`Error fetching Mega Pokemon #${id}:`, error);
    return null;
  }
}

async function fetchAllMegaEvolutions() {
  const megaPokemon: PokemonData[] = [];

  for (const id of MEGA_IDS) {
    const mega = await fetchMegaPokemon(id);
    if (mega) {
      megaPokemon.push(mega);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Read existing all-pokemon.json
  const allPokemonPath = join(process.cwd(), 'data', 'all-pokemon.json');
  const existingPokemon = JSON.parse(readFileSync(allPokemonPath, 'utf-8'));

  // Append mega evolutions
  const updatedPokemon = [...existingPokemon, ...megaPokemon];

  // Save back
  writeFileSync(allPokemonPath, JSON.stringify(updatedPokemon, null, 2), 'utf-8');

  console.log(`\nSuccessfully fetched ${megaPokemon.length} Mega Evolution Pokemon!`);
  console.log(`Total Pokemon now: ${updatedPokemon.length}`);
  console.log(`Data saved to: ${allPokemonPath}`);
}

// Run the script
fetchAllMegaEvolutions().catch(console.error);
