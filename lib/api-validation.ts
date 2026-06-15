import { z } from 'zod';

// ポケモン個体のバリデーション
const PokemonSchema = z.object({
  id: z.string().min(1).max(100),
  // 通常種は 1〜721、フォーム違い(ニャオニクス♀やロトム各種など)は 10000番台
  speciesId: z.number().int().min(1).max(100000),
  species: z.string().min(1).max(30),
  nickname: z.string().max(12).optional(),
  level: z.number().int().min(1).max(50),
  gender: z.enum(['オス', 'メス', '不明']).optional(),
  ability: z.string().min(1).max(30),
  item: z.string().max(30).optional(),
  moves: z.array(z.string().min(1).max(30)).min(1).max(4),
  shiny: z.boolean().optional(),
});

// パーティのバリデーション
const TeamSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(30),
  pokemon: z.array(PokemonSchema).min(1).max(6),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int().min(0).optional(),
});

// POST /api/teams リクエストボディ
export const SaveTeamBodySchema = z.object({
  team: TeamSchema,
  overwrite: z.boolean().optional().default(false),
  // 楽観ロック: 競合検出をスキップして強制上書きする
  force: z.boolean().optional().default(false),
});

// teamIdパラメータ
export const TeamIdSchema = z.string().min(1).max(100);

// POST /api/share リクエストボディ
export const ShareTeamBodySchema = z.object({
  team: TeamSchema,
});

// shortIdパラメータ (nanoid 8文字, URL-safe)
export const ShortIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8}$/);

// リクエストサイズ上限（50KB）
export const MAX_REQUEST_SIZE = 50_000;

export function checkContentLength(request: Request): boolean {
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  return contentLength <= MAX_REQUEST_SIZE;
}
