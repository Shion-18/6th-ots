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

// 性格
export type Nature =
  | 'がんばりや' | 'さみしがり' | 'ゆうかん' | 'いじっぱり' | 'やんちゃ'
  | 'ずぶとい' | 'すなお' | 'のんき' | 'わんぱく' | 'のうてんき'
  | 'おくびょう' | 'せっかち' | 'まじめ' | 'ようき' | 'むじゃき'
  | 'ひかえめ' | 'おっとり' | 'れいせい' | 'てれや' | 'うっかりや'
  | 'おだやか' | 'おとなしい' | 'なまいき' | 'しんちょう' | 'きまぐれ';

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

// 種族値
export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

// 個体値（IV）
export interface IVs {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

// 努力値（EV）
export interface EVs {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

// 実数値
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

// ポケモンの基本データ
export interface PokemonSpecies {
  id: number;
  nationalDex: number;
  name: string;
  nameEn: string;
  types: PokemonType[];
  baseStats: BaseStats;
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
  evs?: EVs; // 努力値（オプショナル）
  ivs?: IVs; // 個体値（オプショナル）
  moves: string[]; // 技（最大4つ）
  shiny?: boolean; // 色違い
  stats?: Stats; // 実数値（オプショナル）
}

// パーティ
export interface Team {
  id: string;
  name: string;
  pokemon: Pokemon[];
  createdAt: string;
  updatedAt: string;
  format?: 'singles' | 'doubles'; // シングル/ダブル
}

// URL共有用のエンコードされたパーティデータ
export interface EncodedTeam {
  teamId: string;
  data: string; // Base64エンコードされたJSON
}
