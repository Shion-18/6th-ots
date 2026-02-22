import { describe, test, expect, beforeEach } from 'vitest';
import {
  getCompetitiveItems,
  getMegaStonesForPokemon,
  isMegaStone,
} from '@/lib/item-helpers';

describe('item-helpers', () => {
  // テスト8: アイテムフィルタリング
  describe('getCompetitiveItems', () => {
    test('対戦アイテムのみが返される', () => {
      const items = getCompetitiveItems();

      expect(items.length).toBeGreaterThan(0);
      expect(items.every(item => item.competitive === true)).toBe(true);

      // 代表的な対戦アイテムが含まれているか確認
      const itemNames = items.map(item => item.name);
      expect(itemNames).toContain('いのちのたま');
      expect(itemNames).toContain('こだわりスカーフ');
    });
  });

  describe('getMegaStonesForPokemon', () => {
    test('メガストーンが正しく取得される（リザードン）', () => {
      const stones = getMegaStonesForPokemon(6); // リザードンID

      expect(stones.length).toBeGreaterThan(0);

      const stoneNames = stones.map(stone => stone.name);
      expect(stoneNames).toContain('リザードナイトX');
      expect(stoneNames).toContain('リザードナイトY');
    });

    test('メガ進化なしのポケモンは空配列', () => {
      const stones = getMegaStonesForPokemon(25); // ピカチュウ
      expect(stones).toEqual([]);
    });

    test('nullを渡すと空配列が返される', () => {
      const stones = getMegaStonesForPokemon(null);
      expect(stones).toEqual([]);
    });
  });

  describe('isMegaStone', () => {
    test('メガストーンの判定が正しい', () => {
      expect(isMegaStone('リザードナイトX')).toBe(true);
      expect(isMegaStone('リザードナイトY')).toBe(true);
      expect(isMegaStone('ガブリアスナイト')).toBe(true);
    });

    test('通常アイテムはfalseを返す', () => {
      expect(isMegaStone('いのちのたま')).toBe(false);
      expect(isMegaStone('こだわりスカーフ')).toBe(false);
    });

    test('存在しないアイテム名はfalseを返す', () => {
      expect(isMegaStone('存在しないアイテム')).toBe(false);
    });
  });
});
