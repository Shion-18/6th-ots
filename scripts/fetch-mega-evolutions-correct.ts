// Script to fetch ORAS Mega Evolution Pokemon correctly from PokeAPI
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
  megaOf?: number; // National dex number of base Pokemon
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

// ORAS Mega Evolutions with their base Pokemon national dex numbers
const MEGA_FORMS = [
  { name: 'venusaur-mega', baseDex: 3, nameJa: 'メガフシギバナ' },
  { name: 'charizard-mega-x', baseDex: 6, nameJa: 'メガリザードンX' },
  { name: 'charizard-mega-y', baseDex: 6, nameJa: 'メガリザードンY' },
  { name: 'blastoise-mega', baseDex: 9, nameJa: 'メガカメックス' },
  { name: 'alakazam-mega', baseDex: 65, nameJa: 'メガフーディン' },
  { name: 'gengar-mega', baseDex: 94, nameJa: 'メガゲンガー' },
  { name: 'kangaskhan-mega', baseDex: 115, nameJa: 'メガガルーラ' },
  { name: 'pinsir-mega', baseDex: 127, nameJa: 'メガカイロス' },
  { name: 'gyarados-mega', baseDex: 130, nameJa: 'メガギャラドス' },
  { name: 'aerodactyl-mega', baseDex: 142, nameJa: 'メガプテラ' },
  { name: 'mewtwo-mega-x', baseDex: 150, nameJa: 'メガミュウツーX' },
  { name: 'mewtwo-mega-y', baseDex: 150, nameJa: 'メガミュウツーY' },
  { name: 'ampharos-mega', baseDex: 181, nameJa: 'メガデンリュウ' },
  { name: 'scizor-mega', baseDex: 212, nameJa: 'メガハッサム' },
  { name: 'heracross-mega', baseDex: 214, nameJa: 'メガヘラクロス' },
  { name: 'houndoom-mega', baseDex: 229, nameJa: 'メガヘルガー' },
  { name: 'tyranitar-mega', baseDex: 248, nameJa: 'メガバンギラス' },
  { name: 'blaziken-mega', baseDex: 257, nameJa: 'メガバシャーモ' },
  { name: 'gardevoir-mega', baseDex: 282, nameJa: 'メガサーナイト' },
  { name: 'mawile-mega', baseDex: 303, nameJa: 'メガクチート' },
  { name: 'aggron-mega', baseDex: 306, nameJa: 'メガボスゴドラ' },
  { name: 'medicham-mega', baseDex: 308, nameJa: 'メガチャーレム' },
  { name: 'manectric-mega', baseDex: 310, nameJa: 'メガライボルト' },
  { name: 'banette-mega', baseDex: 354, nameJa: 'メガジュペッタ' },
  { name: 'absol-mega', baseDex: 359, nameJa: 'メガアブソル' },
  { name: 'garchomp-mega', baseDex: 445, nameJa: 'メガガブリアス' },
  { name: 'lucario-mega', baseDex: 448, nameJa: 'メガルカリオ' },
  { name: 'abomasnow-mega', baseDex: 460, nameJa: 'メガユキノオー' },
  { name: 'beedrill-mega', baseDex: 15, nameJa: 'メガスピアー' },
  { name: 'pidgeot-mega', baseDex: 18, nameJa: 'メガピジョット' },
  { name: 'slowbro-mega', baseDex: 80, nameJa: 'メガヤドラン' },
  { name: 'steelix-mega', baseDex: 208, nameJa: 'メガハガネール' },
  { name: 'sceptile-mega', baseDex: 254, nameJa: 'メガジュカイン' },
  { name: 'swampert-mega', baseDex: 260, nameJa: 'メガラグラージ' },
  { name: 'sableye-mega', baseDex: 302, nameJa: 'メガヤミラミ' },
  { name: 'sharpedo-mega', baseDex: 319, nameJa: 'メガサメハダー' },
  { name: 'camerupt-mega', baseDex: 323, nameJa: 'メガバクーダ' },
  { name: 'altaria-mega', baseDex: 334, nameJa: 'メガチルタリス' },
  { name: 'glalie-mega', baseDex: 362, nameJa: 'メガオニゴーリ' },
  { name: 'salamence-mega', baseDex: 373, nameJa: 'メガボーマンダ' },
  { name: 'metagross-mega', baseDex: 376, nameJa: 'メガメタグロス' },
  { name: 'latias-mega', baseDex: 380, nameJa: 'メガラティアス' },
  { name: 'latios-mega', baseDex: 381, nameJa: 'メガラティオス' },
  { name: 'rayquaza-mega', baseDex: 384, nameJa: 'メガレックウザ' },
  { name: 'lopunny-mega', baseDex: 428, nameJa: 'メガミミロップ' },
  { name: 'gallade-mega', baseDex: 475, nameJa: 'メガエルレイド' },
  { name: 'audino-mega', baseDex: 531, nameJa: 'メガタブンネ' },
  { name: 'diancie-mega', baseDex: 719, nameJa: 'メガディアンシー' },
];

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

async function fetchMegaPokemon(megaName: string, baseDex: number, nameJa: string): Promise<PokemonData | null> {
  try {
    console.log(`Fetching ${nameJa} (${megaName})...`);

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${megaName}`);
    if (!response.ok) {
      console.error(`Failed to fetch ${megaName}`);
      return null;
    }

    const data = await response.json();

    // Fetch Japanese ability names
    const abilities: string[] = [];
    for (const abilityEntry of data.abilities) {
      const jaAbility = await fetchAbilityJapaneseName(abilityEntry.ability.name);
      abilities.push(jaAbility);
    }

    const pokemonData: PokemonData = {
      id: data.id,
      name: megaName,
      nameEn: data.name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      nameJa: nameJa,
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
      megaOf: baseDex,
    };

    return pokemonData;
  } catch (error) {
    console.error(`Error fetching ${megaName}:`, error);
    return null;
  }
}

async function fetchAllMegaEvolutions() {
  const megaPokemon: PokemonData[] = [];

  for (const mega of MEGA_FORMS) {
    const megaData = await fetchMegaPokemon(mega.name, mega.baseDex, mega.nameJa);
    if (megaData) {
      megaPokemon.push(megaData);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Read existing all-pokemon.json and remove old incorrect mega data (ID >= 10003)
  const allPokemonPath = join(process.cwd(), 'data', 'all-pokemon.json');
  const existingPokemon = JSON.parse(readFileSync(allPokemonPath, 'utf-8'));

  // Keep only regular Pokemon (ID <= 721)
  const regularPokemon = existingPokemon.filter((p: PokemonData) => p.id <= 721);

  // Append mega evolutions
  const updatedPokemon = [...regularPokemon, ...megaPokemon];

  // Save back
  writeFileSync(allPokemonPath, JSON.stringify(updatedPokemon, null, 2), 'utf-8');

  console.log(`\nSuccessfully fetched ${megaPokemon.length} Mega Evolution Pokemon!`);
  console.log(`Total Pokemon now: ${updatedPokemon.length}`);
  console.log(`Data saved to: ${allPokemonPath}`);
}

// Run the script
fetchAllMegaEvolutions().catch(console.error);
