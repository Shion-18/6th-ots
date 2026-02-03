import { IVs, EVs, Stats, Nature } from '@/types/pokemon';

// 性格補正値を取得
export function getNatureModifier(nature: Nature, stat: 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed'): number {
  const natureModifiers: Record<Nature, { plus?: string; minus?: string }> = {
    'がんばりや': {},
    'さみしがり': { plus: 'attack', minus: 'defense' },
    'ゆうかん': { plus: 'attack', minus: 'speed' },
    'いじっぱり': { plus: 'attack', minus: 'specialAttack' },
    'やんちゃ': { plus: 'attack', minus: 'specialDefense' },
    'ずぶとい': { plus: 'defense', minus: 'attack' },
    'すなお': {},
    'のんき': { plus: 'defense', minus: 'speed' },
    'わんぱく': { plus: 'defense', minus: 'specialAttack' },
    'のうてんき': { plus: 'defense', minus: 'specialDefense' },
    'おくびょう': { plus: 'speed', minus: 'attack' },
    'せっかち': { plus: 'speed', minus: 'defense' },
    'まじめ': {},
    'ようき': { plus: 'speed', minus: 'specialAttack' },
    'むじゃき': { plus: 'speed', minus: 'specialDefense' },
    'ひかえめ': { plus: 'specialAttack', minus: 'attack' },
    'おっとり': { plus: 'specialAttack', minus: 'defense' },
    'れいせい': { plus: 'specialAttack', minus: 'speed' },
    'てれや': { plus: 'specialAttack', minus: 'specialDefense' },
    'うっかりや': { plus: 'specialDefense', minus: 'specialAttack' },
    'おだやか': { plus: 'specialDefense', minus: 'attack' },
    'おとなしい': { plus: 'specialDefense', minus: 'defense' },
    'なまいき': { plus: 'specialDefense', minus: 'speed' },
    'しんちょう': { plus: 'specialDefense', minus: 'specialAttack' },
    'きまぐれ': {}
  };

  const modifier = natureModifiers[nature];
  if (modifier.plus === stat) return 1.1;
  if (modifier.minus === stat) return 0.9;
  return 1.0;
}

// HP実数値を計算
export function calculateHP(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

// HP以外の実数値を計算
export function calculateStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  nature: Nature,
  statType: 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed'
): number {
  const baseStat = Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  const natureModifier = getNatureModifier(nature, statType);
  return Math.floor(baseStat * natureModifier);
}

// 全ステータスを計算
export function calculateAllStats(
  baseStats: { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number },
  ivs: IVs,
  evs: EVs,
  nature: Nature,
  level: number
): Stats {
  return {
    hp: calculateHP(baseStats.hp, ivs.hp, evs.hp, level),
    attack: calculateStat(baseStats.attack, ivs.attack, evs.attack, level, nature, 'attack'),
    defense: calculateStat(baseStats.defense, ivs.defense, evs.defense, level, nature, 'defense'),
    specialAttack: calculateStat(baseStats.specialAttack, ivs.specialAttack, evs.specialAttack, level, nature, 'specialAttack'),
    specialDefense: calculateStat(baseStats.specialDefense, ivs.specialDefense, evs.specialDefense, level, nature, 'specialDefense'),
    speed: calculateStat(baseStats.speed, ivs.speed, evs.speed, level, nature, 'speed')
  };
}

// 努力値の合計が正しいかチェック（最大510、1つのステータスに最大252）
export function validateEVs(evs: EVs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const total = evs.hp + evs.attack + evs.defense + evs.specialAttack + evs.specialDefense + evs.speed;

  if (total > 510) {
    errors.push(`努力値の合計が510を超えています（現在: ${total}）`);
  }

  Object.entries(evs).forEach(([stat, value]) => {
    if (value > 252) {
      errors.push(`${stat}の努力値が252を超えています（現在: ${value}）`);
    }
    if (value < 0) {
      errors.push(`${stat}の努力値が負の値です`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// 個体値が正しいかチェック（0-31）
export function validateIVs(ivs: IVs): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.entries(ivs).forEach(([stat, value]) => {
    if (value < 0 || value > 31) {
      errors.push(`${stat}の個体値は0-31の範囲で指定してください（現在: ${value}）`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
