import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { ShareTeamBodySchema, ShortIdSchema } from '@/lib/api-validation';
import { generateShareUrl } from '@/lib/team-encoder';
import { Team } from '@/types/pokemon';

const validTeam: Team = {
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

describe('ShortIdSchema', () => {
  test('nanoid 8文字（英数・- _）を受け入れる', () => {
    expect(ShortIdSchema.safeParse('aB3xKp9Q').success).toBe(true);
    expect(ShortIdSchema.safeParse('a_b-c_de').success).toBe(true);
    expect(ShortIdSchema.safeParse('--------').success).toBe(true);
  });

  test('長さ違いは拒否', () => {
    expect(ShortIdSchema.safeParse('abc').success).toBe(false);
    expect(ShortIdSchema.safeParse('aB3xKp9Q1').success).toBe(false);
    expect(ShortIdSchema.safeParse('').success).toBe(false);
  });

  test('不正な文字は拒否', () => {
    expect(ShortIdSchema.safeParse('aB3xKp9!').success).toBe(false);
    expect(ShortIdSchema.safeParse('aB3xKp9 ').success).toBe(false);
    expect(ShortIdSchema.safeParse('aB3xKp9/').success).toBe(false);
  });
});

describe('ShareTeamBodySchema', () => {
  test('正しい team を受け入れる', () => {
    const result = ShareTeamBodySchema.safeParse({ team: validTeam });
    expect(result.success).toBe(true);
  });

  test('team が欠けている場合は拒否', () => {
    expect(ShareTeamBodySchema.safeParse({}).success).toBe(false);
  });

  test('不正な team は拒否', () => {
    const bad = { team: { ...validTeam, pokemon: [] } };
    expect(ShareTeamBodySchema.safeParse(bad).success).toBe(false);
  });
});

describe('generateShareUrl', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com' },
      writable: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  test('成功時 /view/<shortId> 形式のURLを返す', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, shortId: 'aB3xKp9Q' }),
    }) as unknown as typeof fetch;

    const url = await generateShareUrl(validTeam);
    expect(url).toBe('https://example.com/view/aB3xKp9Q');
  });

  test('APIエラー時にエラーメッセージを投げる', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Too many requests' }),
    }) as unknown as typeof fetch;

    await expect(generateShareUrl(validTeam)).rejects.toThrow('Too many requests');
  });

  test('successフラグfalseの応答もエラーになる', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'broken' }),
    }) as unknown as typeof fetch;

    await expect(generateShareUrl(validTeam)).rejects.toThrow('broken');
  });
});
