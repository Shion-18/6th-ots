// Move type helper utilities
import pokemonMovesData from '@/data/pokemon-moves.json';

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

interface PokemonMovesData {
  pokemonId: number;
  pokemonName: string;
  moves: MoveDetail[];
}

// Create a Map for fast lookup
let moveTypeMap: Map<string, string> | null = null;
let allMovesMap: Map<string, MoveDetail> | null = null;

function initializeMoveTypeMap(): Map<string, string> {
  if (moveTypeMap) return moveTypeMap;

  moveTypeMap = new Map();
  allMovesMap = new Map();

  // Extract all unique moves from pokemon-moves.json
  (pokemonMovesData as PokemonMovesData[]).forEach((pokemonMoves) => {
    pokemonMoves.moves.forEach((move) => {
      // Use nameJa (Japanese name) as the key
      if (!moveTypeMap!.has(move.nameJa)) {
        moveTypeMap!.set(move.nameJa, move.type);
        allMovesMap!.set(move.nameJa, move);
      }
    });
  });

  return moveTypeMap;
}

/**
 * Get the type for a given move name
 * @param moveName - The Japanese name of the move
 * @returns The type of the move, or null if not found
 */
export function getMoveType(moveName: string): string | null {
  const map = initializeMoveTypeMap();
  return map.get(moveName) || null;
}

/**
 * Get move data by name
 * @param moveName - The Japanese name of the move
 * @returns The full move data, or null if not found
 */
export function getMoveData(moveName: string): MoveDetail | null {
  initializeMoveTypeMap(); // Ensure maps are initialized
  return allMovesMap?.get(moveName) || null;
}

/**
 * Get types for multiple moves
 * @param moveNames - Array of Japanese move names
 * @returns Array of types in the same order (null for not found)
 */
export function getMoveTypes(moveNames: string[]): (string | null)[] {
  const map = initializeMoveTypeMap();
  return moveNames.map((name) => map.get(name) || null);
}
