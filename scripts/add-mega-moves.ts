// Script to add Mega Evolution moves data (inherited from base forms)
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface PokemonData {
  id: number;
  name: string;
  nameEn: string;
  nameJa: string;
  megaOf?: number;
}

interface MovesData {
  pokemonId: number;
  pokemonName: string;
  moves: string[];
}

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

async function addMegaMoves() {
  // Read all-pokemon.json to get Mega Pokemon data
  const allPokemonPath = join(process.cwd(), 'data', 'all-pokemon.json');
  const allPokemon: PokemonData[] = JSON.parse(readFileSync(allPokemonPath, 'utf-8'));

  // Read pokemon-moves.json
  const movesPath = join(process.cwd(), 'data', 'pokemon-moves.json');
  const movesData: MovesData[] = JSON.parse(readFileSync(movesPath, 'utf-8'));

  // Filter for Mega Pokemon
  const megaPokemon = allPokemon.filter(p => p.megaOf !== undefined);

  console.log(`Found ${megaPokemon.length} Mega Evolution Pokemon`);

  // Create move entries for each Mega Pokemon
  const newMoveEntries: MovesData[] = [];

  for (const mega of megaPokemon) {
    const baseId = MEGA_TO_BASE[mega.id];

    if (!baseId) {
      console.warn(`No base Pokemon found for Mega ID ${mega.id}`);
      continue;
    }

    // Find base Pokemon's moves
    const baseMoves = movesData.find(m => m.pokemonId === baseId);

    if (!baseMoves) {
      console.warn(`No moves found for base Pokemon #${baseId}`);
      continue;
    }

    // Create move entry for Mega Pokemon (inheriting all base moves)
    newMoveEntries.push({
      pokemonId: mega.id,
      pokemonName: mega.nameJa,
      moves: [...baseMoves.moves], // Copy all moves from base form
    });

    console.log(`Added moves for ${mega.nameJa} (${baseMoves.moves.length} moves inherited from base #${baseId})`);
  }

  // Append new entries to existing moves data
  const updatedMovesData = [...movesData, ...newMoveEntries];

  // Save updated data
  writeFileSync(movesPath, JSON.stringify(updatedMovesData, null, 2), 'utf-8');

  console.log(`\nSuccessfully added moves for ${newMoveEntries.length} Mega Evolution Pokemon!`);
  console.log(`Total Pokemon with moves: ${updatedMovesData.length}`);
  console.log(`Data saved to: ${movesPath}`);
}

// Run the script
addMegaMoves().catch(console.error);
