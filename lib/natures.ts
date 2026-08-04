// 性格データ。無補正の5性格（まじめ・てれや・がんばりや・すなお・きまぐれ）は
// 対戦上同等のため、代表として「まじめ」のみ提供する。
// 並びは対戦での使用頻度順（よく使うものが上）。無補正の「まじめ」は最下部。
// NATURE_NAMES と NATURES は必ず同じ順序に保つこと（前者は zod enum、後者は表示順）。
export const NATURE_NAMES = [
  // よく使う性格
  'ようき',
  'いじっぱり',
  'おくびょう',
  'ひかえめ',
  'ゆうかん',
  'れいせい',
  'ずぶとい',
  'しんちょう',
  'のんき',
  'なまいき',
  // その他（上昇ステータス順）
  'さみしがり',
  'やんちゃ',
  'わんぱく',
  'のうてんき',
  'おっとり',
  'うっかりや',
  'おだやか',
  'おとなしい',
  'せっかち',
  'むじゃき',
  // 補正なし
  'まじめ',
] as const;

export type Nature = (typeof NATURE_NAMES)[number];

interface NatureInfo {
  name: Nature;
  up: string | null;
  down: string | null;
}

export const NATURES: NatureInfo[] = [
  // よく使う性格
  { name: 'ようき', up: 'すばやさ', down: 'とくこう' },
  { name: 'いじっぱり', up: 'こうげき', down: 'とくこう' },
  { name: 'おくびょう', up: 'すばやさ', down: 'こうげき' },
  { name: 'ひかえめ', up: 'とくこう', down: 'こうげき' },
  { name: 'ゆうかん', up: 'こうげき', down: 'すばやさ' },
  { name: 'れいせい', up: 'とくこう', down: 'すばやさ' },
  { name: 'ずぶとい', up: 'ぼうぎょ', down: 'こうげき' },
  { name: 'しんちょう', up: 'とくぼう', down: 'とくこう' },
  { name: 'のんき', up: 'ぼうぎょ', down: 'すばやさ' },
  { name: 'なまいき', up: 'とくぼう', down: 'すばやさ' },
  // その他（上昇ステータス順）
  { name: 'さみしがり', up: 'こうげき', down: 'ぼうぎょ' },
  { name: 'やんちゃ', up: 'こうげき', down: 'とくぼう' },
  { name: 'わんぱく', up: 'ぼうぎょ', down: 'とくこう' },
  { name: 'のうてんき', up: 'ぼうぎょ', down: 'とくぼう' },
  { name: 'おっとり', up: 'とくこう', down: 'ぼうぎょ' },
  { name: 'うっかりや', up: 'とくこう', down: 'とくぼう' },
  { name: 'おだやか', up: 'とくぼう', down: 'こうげき' },
  { name: 'おとなしい', up: 'とくぼう', down: 'ぼうぎょ' },
  { name: 'せっかち', up: 'すばやさ', down: 'ぼうぎょ' },
  { name: 'むじゃき', up: 'すばやさ', down: 'とくぼう' },
  // 補正なし
  { name: 'まじめ', up: null, down: null },
];

export function getNatureLabel(nature: NatureInfo): string {
  return nature.up
    ? `${nature.name}（${nature.up}↑ ${nature.down}↓）`
    : `${nature.name}（補正なし）`;
}
