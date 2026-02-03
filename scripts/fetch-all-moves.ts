import fs from 'fs';
import path from 'path';

interface MoveData {
  id: string;
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

const TYPE_MAP: { [key: string]: string } = {
  'normal': 'ノーマル',
  'fire': 'ほのお',
  'water': 'みず',
  'electric': 'でんき',
  'grass': 'くさ',
  'ice': 'こおり',
  'fighting': 'かくとう',
  'poison': 'どく',
  'ground': 'じめん',
  'flying': 'ひこう',
  'psychic': 'エスパー',
  'bug': 'むし',
  'rock': 'いわ',
  'ghost': 'ゴースト',
  'dragon': 'ドラゴン',
  'dark': 'あく',
  'steel': 'はがね',
  'fairy': 'フェアリー',
};

const CATEGORY_MAP: { [key: string]: string } = {
  'physical': 'physical',
  'special': 'special',
  'status': 'status',
};

async function fetchMoveDetails(moveUrl: string): Promise<MoveData | null> {
  try {
    const response = await fetch(moveUrl);
    const data = await response.json();

    // Get Japanese name
    const japaneseName = data.names.find((n: any) => n.language.name === 'ja-Hrkt' || n.language.name === 'ja');
    if (!japaneseName) {
      console.log(`No Japanese name for ${data.name}`);
      return null;
    }

    const typeJa = TYPE_MAP[data.type.name] || data.type.name;
    const category = CATEGORY_MAP[data.damage_class.name] || 'status';

    return {
      id: data.name,
      name: japaneseName.name,
      type: typeJa,
      category: category,
      power: data.power,
      accuracy: data.accuracy,
      pp: data.pp,
    };
  } catch (error) {
    console.error(`Error fetching move ${moveUrl}:`, error);
    return null;
  }
}

async function fetchAllMoves() {
  console.log('Fetching all moves from Generation 1-6...');

  // Fetch moves up to Gen 6 (roughly move IDs 1-621)
  const moves: MoveData[] = [];
  const batchSize = 50;

  for (let i = 1; i <= 621; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, 622); j++) {
      batch.push(fetchMoveDetails(`https://pokeapi.co/api/v2/move/${j}`));
    }

    const results = await Promise.all(batch);
    const validMoves = results.filter((m): m is MoveData => m !== null);
    moves.push(...validMoves);

    console.log(`Fetched moves ${i}-${Math.min(i + batchSize - 1, 621)} (${moves.length} total)`);

    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Sort by Japanese name
  moves.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  // Write to file
  const outputPath = path.join(process.cwd(), 'data', 'moves.json');
  fs.writeFileSync(outputPath, JSON.stringify(moves, null, 2), 'utf-8');

  console.log(`\n✅ Successfully fetched ${moves.length} moves!`);
  console.log(`Written to: ${outputPath}`);
}

fetchAllMoves().catch(console.error);
