import { describe, test, expect, beforeEach } from 'vitest';
import { getUserId, isValidUUID } from '@/lib/user-id';

describe('user-id', () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear();
  });

  // テスト10: UUID生成と検証
  describe('getUserId', () => {
    test('初回呼び出しでUUIDが生成される', () => {
      const userId = getUserId();

      expect(userId).toBeTruthy();
      expect(typeof userId).toBe('string');
      expect(isValidUUID(userId)).toBe(true);
    });

    test('2回目以降は同じUUIDを返す', () => {
      const userId1 = getUserId();
      const userId2 = getUserId();

      expect(userId1).toBe(userId2);
    });

    test('生成されたUUIDがlocalStorageに保存される', () => {
      const userId = getUserId();
      const stored = localStorage.getItem('pokemon-app-user-id');

      expect(stored).toBe(userId);
    });
  });

  describe('isValidUUID', () => {
    test('UUID v4形式の検証 - 有効なUUID', () => {
      const valid = '123e4567-e89b-42d3-a456-426614174000';
      expect(isValidUUID(valid)).toBe(true);

      const valid2 = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidUUID(valid2)).toBe(true);
    });

    test('UUID v4形式の検証 - 無効なUUID', () => {
      const invalid = 'invalid-uuid';
      expect(isValidUUID(invalid)).toBe(false);

      const invalid2 = '123e4567-e89b-12d3-a456-42661417400'; // 1文字足りない
      expect(isValidUUID(invalid2)).toBe(false);

      const invalid3 = '123e4567-e89b-22d3-a456-426614174000'; // バージョン2（v4でない）
      expect(isValidUUID(invalid3)).toBe(false);
    });

    test('空文字列や特殊な入力', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('not-a-uuid-at-all')).toBe(false);
    });
  });
});
