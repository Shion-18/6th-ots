// Script to fetch form-change Pokemon for ORAS
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
  formOf?: number; // National dex number of base Pokemon
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

// Form-change Pokemon with their base Pokemon national dex numbers
const FORM_CHANGE_POKEMON = [
  // Rotom forms (479)
  { name: 'rotom-heat', baseDex: 479, nameJa: 'ヒートロトム' },
  { name: 'rotom-wash', baseDex: 479, nameJa: 'ウォッシュロトム' },
  { name: 'rotom-frost', baseDex: 479, nameJa: 'フロストロトム' },
  { name: 'rotom-fan', baseDex: 479, nameJa: 'スピンロトム' },
  { name: 'rotom-mow', baseDex: 479, nameJa: 'カットロトム' },

  // Shaymin forms (492)
  { name: 'shaymin-sky', baseDex: 492, nameJa: 'シェイミ(スカイフォルム)' },

  // Tornadus forms (641)
  { name: 'tornadus-therian', baseDex: 641, nameJa: 'トルネロス(れいじゅうフォルム)' },

  // Thundurus forms (642)
  { name: 'thundurus-therian', baseDex: 642, nameJa: 'ボルトロス(れいじゅうフォルム)' },

  // Landorus forms (645)
  { name: 'landorus-therian', baseDex: 645, nameJa: 'ランドロス(れいじゅうフォルム)' },

  // Darmanitan forms (555)
  { name: 'darmanitan-zen', baseDex: 555, nameJa: 'ヒヒダルマ(ダルマモード)' },

  // Wormadam forms (413)
  { name: 'wormadam-sandy', baseDex: 413, nameJa: 'ミノマダム(すなちのミノ)' },
  { name: 'wormadam-trash', baseDex: 413, nameJa: 'ミノマダム(ゴミのミノ)' },

  // Hoopa forms (720) - only Unbound is in ORAS
  { name: 'hoopa-unbound', baseDex: 720, nameJa: 'フーパ(ときはなたれしすがた)' },
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

async function fetchFormChangePokemon(formName: string, baseDex: number, nameJa: string): Promise<PokemonData | null> {
  try {
    console.log(`Fetching ${nameJa} (${formName})...`);

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${formName}`);
    if (!response.ok) {
      console.error(`Failed to fetch ${formName}`);
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
      name: formName,
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
      formOf: baseDex,
    };

    return pokemonData;
  } catch (error) {
    console.error(`Error fetching ${formName}:`, error);
    return null;
  }
}

async function fetchAllFormChangePokemon() {
  const formChangePokemon: PokemonData[] = [];

  for (const form of FORM_CHANGE_POKEMON) {
    const formData = await fetchFormChangePokemon(form.name, form.baseDex, form.nameJa);
    if (formData) {
      formChangePokemon.push(formData);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Read existing all-pokemon.json
  const allPokemonPath = join(process.cwd(), 'data', 'all-pokemon.json');
  const existingPokemon = JSON.parse(readFileSync(allPokemonPath, 'utf-8'));

  // Append form-change Pokemon
  const updatedPokemon = [...existingPokemon, ...formChangePokemon];

  // Save back
  writeFileSync(allPokemonPath, JSON.stringify(updatedPokemon, null, 2), 'utf-8');

  console.log(`\nSuccessfully fetched ${formChangePokemon.length} form-change Pokemon!`);
  console.log(`Total Pokemon now: ${updatedPokemon.length}`);
  console.log(`Data saved to: ${allPokemonPath}`);
}

// Run the script
fetchAllFormChangePokemon().catch(console.error);
