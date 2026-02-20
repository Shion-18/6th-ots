import { Team } from '@/types/pokemon';
import { getUserId } from './user-id';
import { getTeamsFromLocalStorage, saveTeamToLocalStorage } from './team-encoder';

/**
 * APIを通じてパーティを保存する
 *
 * @param team 保存するパーティ
 * @returns 保存結果（success, needsConfirmation）
 */
export async function saveTeamToAPI(team: Team, overwrite = false): Promise<{ success: boolean; needsConfirmation?: boolean; existingTeamName?: string }> {
  try {
    const userId = getUserId();
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ team, overwrite })
    });

    const data = await response.json();

    // 成功時はlocalStorageにもバックアップ
    if (data.success) {
      saveTeamToLocalStorage(team);
    }

    return data;
  } catch (error) {
    console.error('API save failed:', error);

    // フォールバック: localStorageに保存
    const result = saveTeamToLocalStorage(team);
    return result;
  }
}

/**
 * APIを通じて全パーティを取得する
 *
 * @returns パーティの配列
 */
export async function getTeamsFromAPI(): Promise<Team[]> {
  try {
    const userId = getUserId();
    const response = await fetch('/api/teams', {
      headers: { 'x-user-id': userId }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    console.error('API fetch failed:', error);

    // フォールバック: localStorageから取得
    return getTeamsFromLocalStorage();
  }
}

/**
 * APIを通じてパーティを削除する
 *
 * @param teamId 削除するパーティID
 * @returns 削除成功の場合true
 */
export async function deleteTeamFromAPI(teamId: string): Promise<boolean> {
  try {
    const userId = getUserId();
    const response = await fetch(`/api/teams/${teamId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId }
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('API delete failed:', error);
    return false;
  }
}

/**
 * 共有リンクを生成する
 *
 * @param team 共有するパーティ
 * @returns 共有URL、またはエラーメッセージ
 */
export async function createShareLink(team: Team): Promise<{ shareUrl?: string; error?: string }> {
  try {
    const userId = getUserId();
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ team })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { shareUrl: data.shareUrl };
  } catch (error) {
    console.error('Share link creation failed:', error);
    return { error: '共有リンクの作成に失敗しました' };
  }
}

/**
 * 共有IDからパーティを取得する
 *
 * @param shareId 共有ID
 * @returns パーティ、または null
 */
export async function getSharedTeam(shareId: string): Promise<Team | null> {
  try {
    const response = await fetch(`/api/share/${shareId}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Share link expired or not found');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.team || null;
  } catch (error) {
    console.error('Shared team fetch failed:', error);
    return null;
  }
}

/**
 * localStorageからKVへの自動マイグレーション
 *
 * @returns 移行が実行された場合true
 */
export async function migrateLocalStorageToKV(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const migrationKey = 'pokemon-app-migrated';

  // 既に移行済みかチェック
  if (localStorage.getItem(migrationKey)) {
    return false;
  }

  try {
    const localTeams = getTeamsFromLocalStorage();

    if (localTeams.length === 0) {
      localStorage.setItem(migrationKey, 'true');
      return false;
    }

    // KVにアップロード
    for (const team of localTeams) {
      const result = await saveTeamToAPI(team);
      if (!result.success && result.needsConfirmation) {
        // 上書き確認が必要な場合は、overwriteフラグで再送信
        await saveTeamToAPIWithOverwrite(team);
      }
    }

    // 移行完了フラグ
    localStorage.setItem(migrationKey, 'true');
    console.log('✓ Successfully migrated teams to cloud storage');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

/**
 * 上書きフラグ付きでパーティを保存する（内部用）
 */
async function saveTeamToAPIWithOverwrite(team: Team): Promise<void> {
  const userId = getUserId();
  await fetch('/api/teams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify({ team, overwrite: true })
  });
}
