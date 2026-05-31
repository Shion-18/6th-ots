import { describe, test, expect } from 'vitest';
import { SaveTeamBodySchema } from '@/lib/api-validation';
import { Team } from '@/types/pokemon';

const baseTeam: Team = {
  id: 'team-1',
  name: 'テストパーティ',
  pokemon: [
    {
      id: 'p1',
      speciesId: 25,
      species: 'ピカチュウ',
      level: 50,
      ability: 'せいでんき',
      moves: ['10まんボルト'],
    },
  ],
  createdAt: '2026-02-09T00:00:00Z',
  updatedAt: '2026-02-09T00:00:00Z',
};

describe('SaveTeamBodySchema', () => {
  test('version 付きの team を受け入れる', () => {
    const result = SaveTeamBodySchema.safeParse({ team: { ...baseTeam, version: 3 } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.team.version).toBe(3);
    }
  });

  test('version 省略でも受け入れる（後方互換）', () => {
    const result = SaveTeamBodySchema.safeParse({ team: baseTeam });
    expect(result.success).toBe(true);
  });

  test('force フラグはデフォルト false', () => {
    const result = SaveTeamBodySchema.safeParse({ team: baseTeam });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.force).toBe(false);
    }
  });

  test('force=true を受け入れる', () => {
    const result = SaveTeamBodySchema.safeParse({ team: baseTeam, force: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.force).toBe(true);
    }
  });

  test('version が負の数だと拒否', () => {
    const result = SaveTeamBodySchema.safeParse({ team: { ...baseTeam, version: -1 } });
    expect(result.success).toBe(false);
  });
});
