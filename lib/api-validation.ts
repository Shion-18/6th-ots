import { z } from 'zod';

// ポケモン個体のバリデーション
const PokemonSchema = z.object({
  id: z.string().min(1).max(100),
  speciesId: z.number().int().min(1).max(10000),
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
  format: z.enum(['singles', 'doubles']).optional(),
  version: z.number().int().min(0).optional(),
});

// POST /api/teams リクエストボディ
export const SaveTeamBodySchema = z.object({
  team: TeamSchema,
  overwrite: z.boolean().optional().default(false),
});

// teamIdパラメータ
export const TeamIdSchema = z.string().min(1).max(100);

// リクエストサイズ上限（50KB）
export const MAX_REQUEST_SIZE = 50_000;

export function checkContentLength(request: Request): boolean {
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  return contentLength <= MAX_REQUEST_SIZE;
}
