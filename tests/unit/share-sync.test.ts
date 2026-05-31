import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Team } from '@/types/pokemon';

const kvMock = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('@vercel/kv', () => ({
  kv: kvMock,
}));

const team: Team = {
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

describe('syncShareSnapshot', () => {
  beforeEach(() => {
    kvMock.get.mockReset();
    kvMock.set.mockReset();
  });

  test('共有が存在しない場合は何もしない', async () => {
    const { syncShareSnapshot } = await import('@/lib/share-sync');
    kvMock.get.mockResolvedValue(null);

    const result = await syncShareSnapshot(team.id, team);

    expect(result).toEqual({ updated: false });
    expect(kvMock.get).toHaveBeenCalledWith('team:team-1:share');
    expect(kvMock.set).not.toHaveBeenCalled();
  });

  test('共有が存在する場合は share:{shortId} と reverseKey を TTL付きで更新する', async () => {
    const { syncShareSnapshot, SHARE_TTL_SECONDS } = await import('@/lib/share-sync');
    kvMock.get.mockResolvedValue('aB3xKp9Q');

    const result = await syncShareSnapshot(team.id, team);

    expect(result).toEqual({ updated: true, shortId: 'aB3xKp9Q' });
    expect(kvMock.set).toHaveBeenCalledWith('share:aB3xKp9Q', team, { ex: SHARE_TTL_SECONDS });
    expect(kvMock.set).toHaveBeenCalledWith('team:team-1:share', 'aB3xKp9Q', { ex: SHARE_TTL_SECONDS });
  });
});
