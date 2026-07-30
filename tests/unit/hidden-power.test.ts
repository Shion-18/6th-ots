import { describe, test, expect } from 'vitest';
import {
  expandHiddenPower,
  hiddenPowerName,
  HIDDEN_POWER_NAME,
  HIDDEN_POWER_VARIANTS,
  type MoveDetail,
} from '@/lib/hidden-power';

const hiddenPower: MoveDetail = {
  id: 237,
  name: 'hidden-power',
  nameJa: HIDDEN_POWER_NAME,
  type: 'ノーマル',
  category: '特殊',
  power: 60,
  accuracy: 100,
  pp: 15,
};

const flamethrower: MoveDetail = {
  id: 53,
  name: 'flamethrower',
  nameJa: 'かえんほうしゃ',
  type: 'ほのお',
  category: '特殊',
  power: 90,
  accuracy: 100,
  pp: 15,
};

const tackle: MoveDetail = {
  id: 33,
  name: 'tackle',
  nameJa: 'たいあたり',
  type: 'ノーマル',
  category: '物理',
  power: 40,
  accuracy: 100,
  pp: 35,
};

describe('hidden-power', () => {
  test('16タイプ分の変種が定義されている', () => {
    expect(HIDDEN_POWER_VARIANTS).toHaveLength(16);

    const types = HIDDEN_POWER_VARIANTS.map((v) => v.type);
    expect(new Set(types).size).toBe(16);
    // ノーマルとフェアリーは対象外
    expect(types).not.toContain('ノーマル');
    expect(types).not.toContain('フェアリー');
  });

  test('めざめるパワーが16種に展開される', () => {
    const result = expandHiddenPower([tackle, hiddenPower, flamethrower]);

    expect(result).toHaveLength(3 - 1 + 16);
    // 元の位置に挿入される
    expect(result[0].nameJa).toBe('たいあたり');
    expect(result[1].nameJa).toBe('めざめるパワー（闘）');
    expect(result[16].nameJa).toBe('めざめるパワー（悪）');
    expect(result[17].nameJa).toBe('かえんほうしゃ');

    // 元の技名は消える
    expect(result.some((m) => m.nameJa === HIDDEN_POWER_NAME)).toBe(false);
  });

  test('変種のタイプと表記が対応している', () => {
    const result = expandHiddenPower([hiddenPower]);
    const byName = new Map(result.map((m) => [m.nameJa, m]));

    expect(byName.get('めざめるパワー（炎）')?.type).toBe('ほのお');
    expect(byName.get('めざめるパワー（闘）')?.type).toBe('かくとう');
    expect(byName.get('めざめるパワー（霊）')?.type).toBe('ゴースト');
    expect(byName.get('めざめるパワー（超）')?.type).toBe('エスパー');
    expect(byName.get('めざめるパワー（龍）')?.type).toBe('ドラゴン');
  });

  test('威力・命中・PP・分類は元の技を引き継ぐ', () => {
    const result = expandHiddenPower([hiddenPower]);

    for (const move of result) {
      expect(move.category).toBe('特殊');
      expect(move.power).toBe(60);
      expect(move.accuracy).toBe(100);
      expect(move.pp).toBe(15);
    }
  });

  test('変種のIDと英語名が一意', () => {
    const result = expandHiddenPower([tackle, hiddenPower]);

    expect(new Set(result.map((m) => m.id)).size).toBe(result.length);
    expect(new Set(result.map((m) => m.name)).size).toBe(result.length);
  });

  test('めざめるパワーを含まない場合は元の配列をそのまま返す', () => {
    const moves = [tackle, flamethrower];
    expect(expandHiddenPower(moves)).toBe(moves);
  });

  test('hiddenPowerNameは全角括弧で技名を作る', () => {
    expect(hiddenPowerName('水')).toBe('めざめるパワー（水）');
  });
});
