import items from '@/data/items.json';
import megaStones from '@/data/mega-stones.json';

export interface CompetitiveItem {
  id: string;
  name: string;
  category: string;
  competitive: boolean;
  typeBoost?: string;
}

export interface MegaStone {
  id: string;
  name: string;
  basePokemonId: number;
  basePokemonName: string;
  megaFormId: number;
  megaFormName: string;
}

/**
 * ORAS対戦用持ち物を取得（メガストーン除く）
 */
export function getCompetitiveItems(): CompetitiveItem[] {
  return items.filter((item) => item.competitive === true);
}

/**
 * 特定のポケモンに対応するメガストーンを取得
 * @param pokemonId - ベースポケモンの図鑑番号
 */
export function getMegaStonesForPokemon(
  pokemonId: number | null
): MegaStone[] {
  if (!pokemonId) return [];

  return megaStones.filter(
    (stone) => stone.basePokemonId === pokemonId
  );
}

/**
 * 持ち物がメガストーンかどうか判定
 */
export function isMegaStone(itemName: string): boolean {
  return megaStones.some((stone) => stone.name === itemName);
}
