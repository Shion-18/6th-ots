import { describe, test, expect } from 'vitest';
import { getMoveType, getMoveData } from '@/lib/move-helpers';

describe('move-helpers', () => {
  // テスト9: 技タイプ取得
  describe('getMoveType', () => {
    test('技タイプが正しく取得される', () => {
      expect(getMoveType('かえんほうしゃ')).toBe('ほのお');
      expect(getMoveType('１０まんボルト')).toBe('でんき');
      expect(getMoveType('なみのり')).toBe('みず');
      expect(getMoveType('じしん')).toBe('じめん');
      expect(getMoveType('れいとうビーム')).toBe('こおり');
    });

    test('存在しない技はnullを返す', () => {
      expect(getMoveType('存在しない技')).toBeNull();
      expect(getMoveType('')).toBeNull();
    });
  });

  describe('getMoveData', () => {
    test('技の詳細データが取得できる', () => {
      const move = getMoveData('かえんほうしゃ');

      expect(move).toBeTruthy();
      expect(move?.type).toBe('ほのお');
      expect(move?.category).toBe('特殊');
      expect(move?.power).toBe(90);
      expect(move?.accuracy).toBe(100);
    });

    test('別の技も正しく取得できる', () => {
      const move = getMoveData('１０まんボルト');

      expect(move).toBeTruthy();
      expect(move?.type).toBe('でんき');
      expect(move?.category).toBe('特殊');
      expect(move?.power).toBe(90);
    });

    test('存在しない技はnullを返す', () => {
      const move = getMoveData('存在しない技');
      expect(move).toBeNull();
    });
  });
});
