import { z } from 'zod';
import { NATURE_NAMES } from './natures';

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
  nature: z.enum(NATURE_NAMES).optional(),
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
});

// POST /api/teams リクエストボディ
export const SaveTeamBodySchema = z.object({
  team: TeamSchema,
  overwrite: z.boolean().optional().default(false),
  // 楽観ロック用トークン: クライアントが読み込んだ時点の updated_at。
  // 一致しなければ他端末が先に更新済みとして 409 にする。新規/強制上書き時は省略。
  baseUpdatedAt: z.string().optional(),
});

// teamIdパラメータ
export const TeamIdSchema = z.string().min(1).max(100);

// POST /api/share リクエストボディ（共有スナップショット作成）
export const ShareTeamBodySchema = z.object({
  team: TeamSchema,
});

// 共有ショートID（nanoid: URLセーフ文字, 6〜12文字）
export const ShortIdSchema = z.string().regex(/^[A-Za-z0-9_-]{6,12}$/);

// リクエストサイズ上限（50KB）
export const MAX_REQUEST_SIZE = 50_000;

export function checkContentLength(request: Request): boolean {
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  return contentLength <= MAX_REQUEST_SIZE;
}
