-- 共有スナップショット（ショートURL方式）
-- Supabase ダッシュボード → SQL Editor で実行する。
-- 適用後にアプリの新コード（/api/share, /view/[shortId]）をデプロイすること。

create table if not exists shares (
  short_id   text primary key,
  user_id    text not null,
  team_id    text not null,
  team       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, team_id)
);

-- 同一ユーザー×同一チームの共有を引けるように（再共有でリンク不変・最新化）
create index if not exists shares_user_team_idx on shares (user_id, team_id);
