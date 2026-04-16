import allPokemon from '@/data/all-pokemon.json';

/**
 * ポケモン種族データ（data/all-pokemon.json の要素型）
 * 日本語名・スプライトURL・タイプ等を含む UI 表示用メタ情報。
 */
export interface PokemonData {
  id: number;
  name: string;
  nameJa: string;
  sprite: string;
  types: string[];
}

// モジュール読込時に 1 回だけ Map を構築（O(1) ルックアップ）。
// 複数コンポーネントが同じ Map を共有するため、重複構築を避ける。
const pokemonLookup = new Map<number, PokemonData>(
  (allPokemon as PokemonData[]).map((p) => [p.id, p])
);

/**
 * speciesId からポケモン種族データを取得する。
 * 見つからない場合は undefined（呼び出し側でフォールバック表示する）。
 */
export function getPokemonData(speciesId: number): PokemonData | undefined {
  return pokemonLookup.get(speciesId);
}
