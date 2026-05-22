# CLAUDE.md

ポケモン第6世代オープンチームシート用Webアプリ。UIはすべて日本語。

## スタック
Next.js 16（App Router）/ React 19 / TypeScript 5 / Tailwind CSS 4 / Vercel KV（Redis）

## コマンド
npm run dev / build / test / test:e2e / test:all / lint

## 構成
- `app/` — ページ（builder, my-teams, view）+ APIルート（auth, teams, share, pokemon-moves）
- `components/ui/` — 全て 'use client'。PokemonEditor が主要な編集UI
- `lib/` — session.ts（HMAC認証）, api-validation.ts（Zod）, rate-limit.ts, team-storage.ts（KV + localStorage fallback）
- `data/` — 静的JSON。pokemon-moves.json は大容量なのでAPI経由で読む
- `types/pokemon.ts` — 全型定義
- `tests/` — unit/（Vitest）, e2e/（Playwright, port 3003）

## 認証フロー
クライアントでUUID v4生成 → localStorage保存 → SessionInitializerがAPI経由でCookie設定 → サーバーでHMAC-SHA256検証

## 守るべきルール
- UI文字列は日本語で書く
- pokemon-moves.json をクライアントにバンドルしない
- move-type-map.json は prebuild で自動生成。手動編集しない
- Turbopack は無効（vercel.json の TURBOPACK=0）
- パスエイリアス: `@/*` → プロジェクトルート
