// ポケモンのタイプ
export type PokemonType =
  | 'ノーマル'
  | 'ほのお'
  | 'みず'
  | 'でんき'
  | 'くさ'
  | 'こおり'
  | 'かくとう'
  | 'どく'
  | 'じめん'
  | 'ひこう'
  | 'エスパー'
  | 'むし'
  | 'いわ'
  | 'ゴースト'
  | 'ドラゴン'
  | 'あく'
  | 'はがね'
  | 'フェアリー';

// 性別
export type Gender = 'オス' | 'メス' | '不明';

// 持ち物
export interface Item {
  id: string;
  name: string;
  spriteUrl?: string;
}

// 技
export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  category: 'physical' | 'special' | 'status';
  power?: number;
  accuracy?: number;
  pp: number;
}

// ポケモンの基本データ
export interface PokemonSpecies {
  id: number;
  nationalDex: number;
  name: string;
  nameEn: string;
  types: PokemonType[];
  abilities: string[];
  hiddenAbility?: string;
  spriteUrl?: string;
}

// パーティ内のポケモン個体
export interface Pokemon {
  id: string; // ユニークID（パーティ内で一意）
  speciesId: number; // 図鑑番号
  species: string; // ポケモン名
  nickname?: string; // ニックネーム
  level: number; // レベル（通常は50または100）
  gender?: Gender;
  ability: string; // 特性
  item?: string; // 持ち物
  nature?: string; // 性格（任意。未設定時は表示側で「—」）
  moves: string[]; // 技（最大4つ）
  shiny?: boolean; // 色違い
}

// パーティ
export interface Team {
  id: string;
  name: string;
  pokemon: Pokemon[];
  createdAt: string;
  updatedAt: string;
}

// URL共有用のエンコードされたパーティデータ
export interface EncodedTeam {
  teamId: string;
  data: string; // Base64エンコードされたJSON
}
