import { describe, it, expect } from 'vitest';
import { SaveTeamBodySchema } from '@/lib/api-validation';

const validTeam = {
  id: 'team-1',
  name: 'テストパーティ',
  pokemon: [
    {
      id: 'p1',
      speciesId: 6,
      species: 'リザードン',
      level: 50,
      ability: 'もうか',
      moves: ['かえんほうしゃ'],
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('SaveTeamBodySchema', () => {
  it('baseUpdatedAt 付きの保存ボディを受理する（楽観ロック）', () => {
    const result = SaveTeamBodySchema.safeParse({
      team: validTeam,
      baseUpdatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseUpdatedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(result.data.overwrite).toBe(false); // 既定値
    }
  });

  it('baseUpdatedAt 省略（新規/初回）も受理する', () => {
    const result = SaveTeamBodySchema.safeParse({ team: validTeam });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseUpdatedAt).toBeUndefined();
    }
  });

  it('overwrite=true（強制上書き）を受理する', () => {
    const result = SaveTeamBodySchema.safeParse({ team: validTeam, overwrite: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.overwrite).toBe(true);
  });

  it('10000番台フォームIDの speciesId を受理する', () => {
    const result = SaveTeamBodySchema.safeParse({
      team: { ...validTeam, pokemon: [{ ...validTeam.pokemon[0], speciesId: 10023 }] },
    });
    expect(result.success).toBe(true);
  });

  it('技0個は拒否する', () => {
    const result = SaveTeamBodySchema.safeParse({
      team: { ...validTeam, pokemon: [{ ...validTeam.pokemon[0], moves: [] }] },
    });
    expect(result.success).toBe(false);
  });
});
