import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Team, Pokemon } from '@/types/pokemon';

/**
 * Supabase teams テーブルの行型（DBカラム名・snake_case）
 */
export interface TeamRow {
  id: string;
  user_id: string;
  name: string;
  pokemon: Pokemon[];
  created_at: string;
  updated_at: string;
}

/**
 * DB行 → アプリ内 Team 型へ変換（API応答の形を維持するため）
 */
export function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    pokemon: row.pokemon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

let client: SupabaseClient | null = null;

/**
 * サーバー専用 Supabase クライアントのシングルトン取得。
 * 自前のHMACセッション認証を使うため、service_role キーで全権アクセス。
 * RLSは設定していない前提（API層でuser_idチェックを行う）。
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase credentials are not set. Please define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}
