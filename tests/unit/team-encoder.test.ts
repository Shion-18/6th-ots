import { describe, test, expect, beforeEach } from 'vitest';
import {
  encodeTeam,
  decodeTeam,
  saveTeamToLocalStorage,
  getTeamsFromLocalStorage,
  deleteTeamFromLocalStorage,
} from '@/lib/team-encoder';
import { Team } from '@/types/pokemon';

describe('team-encoder', () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear();
  });

  // テスト1: localStorage保存 - 初回保存成功
  describe('saveTeamToLocalStorage - 初回保存', () => {
    test('初回パーティ保存が成功する', () => {
      const team: Team = {
        id: 'team-1',
        name: 'テストパーティ',
        pokemon: [],
        createdAt: '2026-02-09T00:00:00Z',
        updatedAt: '2026-02-09T00:00:00Z',
      };

      const result = saveTeamToLocalStorage(team);

      expect(result.success).toBe(true);
      expect(result.needsConfirmation).toBe(false);

      const stored = getTeamsFromLocalStorage();
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('テストパーティ');
      expect(stored[0].id).toBe('team-1');
    });
  });

  // テスト2: localStorage保存 - 1パーティ制限
  describe('saveTeamToLocalStorage - 1パーティ制限', () => {
    test('既に1パーティ存在する場合、確認が必要になる', () => {
      const team1: Team = {
        id: 'team-1',
        name: 'パーティA',
        pokemon: [],
        createdAt: '2026-02-09T00:00:00Z',
        updatedAt: '2026-02-09T00:00:00Z',
      };
      saveTeamToLocalStorage(team1);

      const team2: Team = {
        id: 'team-2',
        name: 'パーティB',
        pokemon: [],
        createdAt: '2026-02-09T00:00:00Z',
        updatedAt: '2026-02-09T00:00:00Z',
      };
      const result = saveTeamToLocalStorage(team2);

      expect(result.success).toBe(false);
      expect(result.needsConfirmation).toBe(true);
      expect(result.existingTeamName).toBe('パーティA');

      // team2は保存されていない
      const stored = getTeamsFromLocalStorage();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('team-1');
    });
  });

  // テスト3: localStorage保存 - 既存パーティの更新
  describe('saveTeamToLocalStorage - 既存パーティ更新', () => {
    test('同じIDのパーティは上書き更新される', () => {
      const team: Team = {
        id: 'team-1',
        name: 'オリジナル',
        pokemon: [],
        createdAt: '2026-02-09T00:00:00Z',
        updatedAt: '2026-02-09T00:00:00Z',
      };
      saveTeamToLocalStorage(team);

      const updated: Team = {
        id: 'team-1',
        name: '更新後',
        pokemon: [],
        createdAt: '2026-02-09T00:00:00Z',
        updatedAt: '2026-02-09T01:00:00Z',
      };
      const result = saveTeamToLocalStorage(updated);

      expect(result.success).toBe(true);
      expect(result.needsConfirmation).toBe(false);

      const stored = getTeamsFromLocalStorage();
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('更新後');
      expect(stored[0].id).toBe('team-1');
    });
  });

  // テスト4: localStorage削除
  describe('deleteTeamFromLocalStorage', () => {
    test('パーティ削除後、localStorageから消える', () => {
      const team: Team = {
        id: 'team-1',
        name: 'テスト',
        pokemon: [],
        createdAt: '2026-02-09T00:00:00Z',
        updatedAt: '2026-02-09T00:00:00Z',
      };
      saveTeamToLocalStorage(team);

      deleteTeamFromLocalStorage('team-1');

      const teams = getTeamsFromLocalStorage();
      expect(teams).toHaveLength(0);
    });

    test('存在しないIDの削除でエラーが出ない', () => {
      expect(() => deleteTeamFromLocalStorage('non-existent')).not.toThrow();
    });
  });

  // テスト5: パーティエンコード/デコード - ラウンドトリップ
  describe('encodeTeam / decodeTeam - ラウンドトリップ', () => {
    test('エンコード→デコードでデータが完全に復元される', () => {
      const team: Team = {
        id: 'team-123',
        name: 'テストパーティ',
        pokemon: [
          {
            id: 'p1',
            speciesId: 25,
            species: 'ピカチュウ',
            level: 50,
            ability: 'せいでんき',
            moves: ['10まんボルト', 'でんじは', 'アイアンテール', 'ボルテッカー'],
            item: 'いのちのたま',
            nature: 'ようき',
            evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 },
            ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 },
          },
        ],
        createdAt: '2026-02-09T00:00:00Z',
        updatedAt: '2026-02-09T00:00:00Z',
      };

      const encoded = encodeTeam(team);
      const decoded = decodeTeam(encoded);

      expect(decoded).toEqual(team);
      expect(decoded.pokemon[0].species).toBe('ピカチュウ');
      expect(decoded.pokemon[0].moves).toEqual(['10まんボルト', 'でんじは', 'アイアンテール', 'ボルテッカー']);
    });
  });

  // テスト6: パーティエンコード - 日本語文字対応
  describe('encodeTeam - 日本語文字対応', () => {
    test('日本語文字（ポケモン名、技名）が正しくエンコードされる', () => {
      const team: Team = {
        id: 'team-1',
        name: 'かえんパーティ',
        pokemon: [
          {
            id: 'p1',
            speciesId: 6,
            species: 'リザードン',
            level: 50,
            ability: 'もうか',
            moves: ['かえんほうしゃ', 'りゅうのまい'],
            nature: 'いじっぱり',
            evs: { hp: 0, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 252 },
            ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 },
          },
        ],
        createdAt: '2026-02-09T00:00:00Z',
        updatedAt: '2026-02-09T00:00:00Z',
      };

      const encoded = encodeTeam(team);
      expect(encoded).toBeTruthy();
      expect(encoded).not.toContain('�'); // 文字化けなし

      const decoded = decodeTeam(encoded);
      expect(decoded.name).toBe('かえんパーティ');
      expect(decoded.pokemon[0].species).toBe('リザードン');
      expect(decoded.pokemon[0].moves).toContain('かえんほうしゃ');
      expect(decoded.pokemon[0].moves).toContain('りゅうのまい');
    });
  });

  // テスト7: パーティデコード - エラーハンドリング
  describe('decodeTeam - エラーハンドリング', () => {
    test('不正なBase64でエラーがスローされる', () => {
      expect(() => decodeTeam('invalid!!!')).toThrow();
    });

    test('破損したJSONでエラーがスローされる', () => {
      const invalidBase64 = btoa('{ invalid json }');
      expect(() => decodeTeam(invalidBase64)).toThrow();
    });
  });
});
