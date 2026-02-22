import fs from 'fs';
import path from 'path';

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

const dataPath = path.join(__dirname, '..', 'data', 'pokemon-moves.json');
const outputPath = path.join(__dirname, '..', 'data', 'move-type-map.json');

const pokemonMoves: PokemonMovesEntry[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const moveTypeMap: Record<string, { type: string; category: string; power: number | null; accuracy: number | null; pp: number }> = {};

for (const pokemon of pokemonMoves) {
  for (const move of pokemon.moves) {
    if (!moveTypeMap[move.nameJa]) {
      moveTypeMap[move.nameJa] = {
        type: move.type,
        category: move.category,
        power: move.power,
        accuracy: move.accuracy,
        pp: move.pp,
      };
    }
  }
}

fs.writeFileSync(outputPath, JSON.stringify(moveTypeMap));

console.log(`Generated move-type-map.json with ${Object.keys(moveTypeMap).length} moves`);
