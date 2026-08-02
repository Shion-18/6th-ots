// 性格データ。無補正の5性格（まじめ・てれや・がんばりや・すなお・きまぐれ）は
// 対戦上同等のため、代表として「まじめ」のみ提供する。
export const NATURE_NAMES = [
  'まじめ',
  'さみしがり',
  'いじっぱり',
  'やんちゃ',
  'ゆうかん',
  'ずぶとい',
  'わんぱく',
  'のうてんき',
  'のんき',
  'ひかえめ',
  'おっとり',
  'うっかりや',
  'れいせい',
  'おだやか',
  'おとなしい',
  'しんちょう',
  'なまいき',
  'おくびょう',
  'せっかち',
  'ようき',
  'むじゃき',
] as const;

export type Nature = (typeof NATURE_NAMES)[number];

interface NatureInfo {
  name: Nature;
  up: string | null;
  down: string | null;
}

export const NATURES: NatureInfo[] = [
  { name: 'まじめ', up: null, down: null },
  { name: 'さみしがり', up: 'こうげき', down: 'ぼうぎょ' },
  { name: 'いじっぱり', up: 'こうげき', down: 'とくこう' },
  { name: 'やんちゃ', up: 'こうげき', down: 'とくぼう' },
  { name: 'ゆうかん', up: 'こうげき', down: 'すばやさ' },
  { name: 'ずぶとい', up: 'ぼうぎょ', down: 'こうげき' },
  { name: 'わんぱく', up: 'ぼうぎょ', down: 'とくこう' },
  { name: 'のうてんき', up: 'ぼうぎょ', down: 'とくぼう' },
  { name: 'のんき', up: 'ぼうぎょ', down: 'すばやさ' },
  { name: 'ひかえめ', up: 'とくこう', down: 'こうげき' },
  { name: 'おっとり', up: 'とくこう', down: 'ぼうぎょ' },
  { name: 'うっかりや', up: 'とくこう', down: 'とくぼう' },
  { name: 'れいせい', up: 'とくこう', down: 'すばやさ' },
  { name: 'おだやか', up: 'とくぼう', down: 'こうげき' },
  { name: 'おとなしい', up: 'とくぼう', down: 'ぼうぎょ' },
  { name: 'しんちょう', up: 'とくぼう', down: 'とくこう' },
  { name: 'なまいき', up: 'とくぼう', down: 'すばやさ' },
  { name: 'おくびょう', up: 'すばやさ', down: 'こうげき' },
  { name: 'せっかち', up: 'すばやさ', down: 'ぼうぎょ' },
  { name: 'ようき', up: 'すばやさ', down: 'とくこう' },
  { name: 'むじゃき', up: 'すばやさ', down: 'とくぼう' },
];

export function getNatureLabel(nature: NatureInfo): string {
  return nature.up
    ? `${nature.name}（${nature.up}↑ ${nature.down}↓）`
    : `${nature.name}（補正なし）`;
}
