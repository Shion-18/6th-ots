import { describe, test, expect, beforeEach } from 'vitest';
import {
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

});
