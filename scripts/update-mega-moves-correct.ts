// Script to update Mega Evolution moves data correctly
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PokemonData {
  id: number;
  name: string;
  nameJa: string;
  megaOf?: number;
}

interface MovesData {
  pokemonId: number;
  pokemonName: string;
  moves: string[];
}

async function updateMegaMoves() {
  // Read all-pokemon.json to get Mega Pokemon data
  const allPokemonPath = join(process.cwd(), 'data', 'all-pokemon.json');
  const allPokemon: PokemonData[] = JSON.parse(readFileSync(allPokemonPath, 'utf-8'));

  // Read pokemon-moves.json
  const movesPath = join(process.cwd(), 'data', 'pokemon-moves.json');
  const movesData: MovesData[] = JSON.parse(readFileSync(movesPath, 'utf-8'));

  // Remove old incorrect mega moves (pokemonId >= 10003)
  const regularMoves = movesData.filter(m => m.pokemonId <= 721);

  // Filter for Mega Pokemon
  const megaPokemon = allPokemon.filter(p => p.megaOf !== undefined);

  console.log(`Found ${megaPokemon.length} Mega Evolution Pokemon`);

  // Create move entries for each Mega Pokemon
  const newMoveEntries: MovesData[] = [];

  for (const mega of megaPokemon) {
    const baseDex = mega.megaOf!;

    // Find base Pokemon's moves
    const baseMoves = regularMoves.find(m => m.pokemonId === baseDex);

    if (!baseMoves) {
      console.warn(`No moves found for base Pokemon #${baseDex}`);
      continue;
    }

    // Create move entry for Mega Pokemon (inheriting all base moves)
    newMoveEntries.push({
      pokemonId: mega.id,
      pokemonName: mega.nameJa,
      moves: [...baseMoves.moves], // Copy all moves from base form
    });

    console.log(`Added moves for ${mega.nameJa} (${baseMoves.moves.length} moves inherited from #${baseDex})`);
  }

  // Combine regular moves with new mega moves
  const updatedMovesData = [...regularMoves, ...newMoveEntries];

  // Save updated data
  writeFileSync(movesPath, JSON.stringify(updatedMovesData, null, 2), 'utf-8');

  console.log(`\nSuccessfully updated moves for ${newMoveEntries.length} Mega Evolution Pokemon!`);
  console.log(`Total Pokemon with moves: ${updatedMovesData.length}`);
  console.log(`Data saved to: ${movesPath}`);
}

// Run the script
updateMegaMoves().catch(console.error);
