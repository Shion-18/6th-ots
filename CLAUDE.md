# CLAUDE.md

ポケモン第6世代オープンチームシート用Webアプリ。UIはすべて日本語。

## スタック
Next.js 16（App Router）/ React 19 / TypeScript 5 / Tailwind CSS 4 / Vercel KV（Redis）

## コマンド
npm run dev / build / test / test:e2e / test:all / lint

## 構成
- `app/` — ページ（builder, my-teams, view, admin）+ APIルート（auth, teams, share, pokemon-moves, admin）
- `components/ui/` — 全て 'use client'。PokemonEditor が主要な編集UI
- `lib/` — session.ts（ユーザーHMAC認証）, admin-session.ts（管理者HMAC認証）, api-validation.ts（Zod）, rate-limit.ts, team-storage.ts（KV + localStorage fallback）
- `data/` — 静的JSON。pokemon-moves.json は大容量なのでAPI経由で読む
- `types/pokemon.ts` — 全型定義
- `tests/` — unit/（Vitest）, e2e/（Playwright, port 3003）
- `middleware.ts` — `/admin/*` を保護（`/admin/login` 除く）

## 認証フロー
- **ユーザー（匿名）**: UUID v4 生成 → localStorage → SessionInitializer が API 経由で `poke-session` Cookie 設定 → HMAC-SHA256 検証
- **管理者（開発者）**: GitHub OAuth → allowlist (`ADMIN_GITHUB_USERNAMES`) 照合 → `admin-session` Cookie 発行（24h TTL、別シークレット）

## 守るべきルール
- UI文字列は日本語で書く
- pokemon-moves.json をクライアントにバンドルしない
- move-type-map.json は prebuild で自動生成。手動編集しない
- Turbopack は無効（vercel.json の TURBOPACK=0）
- パスエイリアス: `@/*` → プロジェクトルート

## 環境変数
`.env.example` 参照。管理画面には `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `ADMIN_GITHUB_USERNAMES` / `ADMIN_SESSION_SECRET` が必要。
