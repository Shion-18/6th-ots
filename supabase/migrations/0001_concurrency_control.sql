-- 排他制御・トランザクション・永続性の確立
-- Supabase ダッシュボード → SQL Editor で実行する。
-- 適用後にアプリの新コード（rpc('save_team') 利用）をデプロイすること。

-- 1) 既存の重複（1ユーザーに複数行）があれば最新の updated_at を残して削除
delete from teams t
 using teams d
 where t.user_id = d.user_id
   and t.ctid <> d.ctid
   and (t.updated_at, t.ctid) < (d.updated_at, d.ctid);

-- 2) 1ユーザー=1行を強制（異なるユーザーは別行＝競合しない / 1パーティ制限をDBで保証）
alter table teams
  add constraint teams_user_id_key unique (user_id);

-- 3) created_at は DB 既定値にして upsert で潰さない
alter table teams
  alter column created_at set default now();

-- 4) 原子的な保存＋楽観ロック（updated_at CAS）を行う関数
--    INSERT ... ON CONFLICT(user_id) DO UPDATE を単一文で実行（行ロックで直列化）。
--    p_base_updated_at が NULL（新規/強制）か、現在の updated_at と一致する場合のみ更新。
--    競合（他端末が先に更新）時は 0 行返却 → 呼び出し側で 409 化。
create or replace function save_team(
  p_user_id text,
  p_id text,
  p_name text,
  p_pokemon jsonb,
  p_base_updated_at timestamptz
) returns setof teams
language plpgsql
as $$
begin
  return query
  insert into teams (id, user_id, name, pokemon, updated_at)
  values (p_id, p_user_id, p_name, p_pokemon, now())
  on conflict (user_id) do update
    set id = excluded.id,
        name = excluded.name,
        pokemon = excluded.pokemon,
        updated_at = now()
    where p_base_updated_at is null
       or teams.updated_at = p_base_updated_at
  returning *;
end;
$$;
