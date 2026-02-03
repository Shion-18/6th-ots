// Script to add form-change Pokemon moves data (inherited from base forms)
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PokemonData {
  id: number;
  name: string;
  nameJa: string;
  formOf?: number;
}

interface MovesData {
  pokemonId: number;
  pokemonName: string;
  moves: string[];
}

async function addFormChangeMoves() {
  // Read all-pokemon.json to get form-change Pokemon data
  const allPokemonPath = join(process.cwd(), 'data', 'all-pokemon.json');
  const allPokemon: PokemonData[] = JSON.parse(readFileSync(allPokemonPath, 'utf-8'));

  // Read pokemon-moves.json
  const movesPath = join(process.cwd(), 'data', 'pokemon-moves.json');
  const movesData: MovesData[] = JSON.parse(readFileSync(movesPath, 'utf-8'));

  // Filter for form-change Pokemon
  const formChangePokemon = allPokemon.filter(p => p.formOf !== undefined && !p.name.includes('mega'));

  console.log(`Found ${formChangePokemon.length} form-change Pokemon`);

  // Create move entries for each form-change Pokemon
  const newMoveEntries: MovesData[] = [];

  for (const form of formChangePokemon) {
    const baseDex = form.formOf!;

    // Find base Pokemon's moves
    const baseMoves = movesData.find(m => m.pokemonId === baseDex);

    if (!baseMoves) {
      console.warn(`No moves found for base Pokemon #${baseDex}`);
      continue;
    }

    // Create move entry for form-change Pokemon (inheriting all base moves)
    newMoveEntries.push({
      pokemonId: form.id,
      pokemonName: form.nameJa,
      moves: [...baseMoves.moves], // Copy all moves from base form
    });

    console.log(`Added moves for ${form.nameJa} (${baseMoves.moves.length} moves inherited from #${baseDex})`);
  }

  // Append new entries to existing moves data
  const updatedMovesData = [...movesData, ...newMoveEntries];

  // Save updated data
  writeFileSync(movesPath, JSON.stringify(updatedMovesData, null, 2), 'utf-8');

  console.log(`\nSuccessfully added moves for ${newMoveEntries.length} form-change Pokemon!`);
  console.log(`Total Pokemon with moves: ${updatedMovesData.length}`);
  console.log(`Data saved to: ${movesPath}`);
}

// Run the script
addFormChangeMoves().catch(console.error);
