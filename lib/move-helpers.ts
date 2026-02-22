// Move type helper utilities
import moveTypeMapData from '@/data/move-type-map.json';

interface MoveDetail {
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

const moveTypeMap = moveTypeMapData as Record<string, MoveDetail>;

/**
 * Get the type for a given move name
 * @param moveName - The Japanese name of the move
 * @returns The type of the move, or null if not found
 */
export function getMoveType(moveName: string): string | null {
  return moveTypeMap[moveName]?.type || null;
}

/**
 * Get move data by name
 * @param moveName - The Japanese name of the move
 * @returns The full move data, or null if not found
 */
export function getMoveData(moveName: string): MoveDetail | null {
  return moveTypeMap[moveName] || null;
}

/**
 * Get types for multiple moves
 * @param moveNames - Array of Japanese move names
 * @returns Array of types in the same order (null for not found)
 */
export function getMoveTypes(moveNames: string[]): (string | null)[] {
  return moveNames.map((name) => moveTypeMap[name]?.type || null);
}
