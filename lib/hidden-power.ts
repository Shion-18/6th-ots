// めざめるパワーのタイプ別変種
// 第6世代のめざめるパワーは個体値でタイプが決まるため、
// 単一の「めざめるパワー」ではなくタイプ別16種として扱う（ノーマル・フェアリーを除く）。
import { PokemonType } from '../types/pokemon';

export interface MoveDetail {
  id: number;
  name: string;
  nameJa: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

// 元データ上の技名
export const HIDDEN_POWER_NAME = 'めざめるパワー';

// 変種のmove ID採番の起点（既存の最大move IDは620なので衝突しない）
const HIDDEN_POWER_ID_BASE = 9000;

export interface HiddenPowerVariant {
  kanji: string;
  type: PokemonType;
  nameEn: string;
}

export const HIDDEN_POWER_VARIANTS: HiddenPowerVariant[] = [
  { kanji: '闘', type: 'かくとう', nameEn: 'hidden-power-fighting' },
  { kanji: '飛', type: 'ひこう', nameEn: 'hidden-power-flying' },
  { kanji: '毒', type: 'どく', nameEn: 'hidden-power-poison' },
  { kanji: '地', type: 'じめん', nameEn: 'hidden-power-ground' },
  { kanji: '岩', type: 'いわ', nameEn: 'hidden-power-rock' },
  { kanji: '虫', type: 'むし', nameEn: 'hidden-power-bug' },
  { kanji: '霊', type: 'ゴースト', nameEn: 'hidden-power-ghost' },
  { kanji: '鋼', type: 'はがね', nameEn: 'hidden-power-steel' },
  { kanji: '炎', type: 'ほのお', nameEn: 'hidden-power-fire' },
  { kanji: '水', type: 'みず', nameEn: 'hidden-power-water' },
  { kanji: '草', type: 'くさ', nameEn: 'hidden-power-grass' },
  { kanji: '電', type: 'でんき', nameEn: 'hidden-power-electric' },
  { kanji: '超', type: 'エスパー', nameEn: 'hidden-power-psychic' },
  { kanji: '氷', type: 'こおり', nameEn: 'hidden-power-ice' },
  { kanji: '龍', type: 'ドラゴン', nameEn: 'hidden-power-dragon' },
  { kanji: '悪', type: 'あく', nameEn: 'hidden-power-dark' },
];

/**
 * 「めざめるパワー（闘）」形式の技名を作る
 */
export function hiddenPowerName(kanji: string): string {
  return `${HIDDEN_POWER_NAME}（${kanji}）`;
}

/**
 * 技リスト内の「めざめるパワー」をタイプ別16種に差し替える
 * @param moves 元の技リスト
 * @returns 差し替え後の技リスト（対象が無ければ元の配列をそのまま返す）
 */
export function expandHiddenPower(moves: MoveDetail[]): MoveDetail[] {
  const index = moves.findIndex((move) => move.nameJa === HIDDEN_POWER_NAME);
  if (index === -1) {
    return moves;
  }

  const base = moves[index];
  const variants: MoveDetail[] = HIDDEN_POWER_VARIANTS.map((variant, i) => ({
    ...base,
    id: HIDDEN_POWER_ID_BASE + i + 1,
    name: variant.nameEn,
    nameJa: hiddenPowerName(variant.kanji),
    type: variant.type,
  }));

  return [...moves.slice(0, index), ...variants, ...moves.slice(index + 1)];
}
