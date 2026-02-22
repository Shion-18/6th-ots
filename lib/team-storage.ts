import { Team } from '@/types/pokemon';
import { getTeamsFromLocalStorage, saveTeamToLocalStorage } from './team-encoder';

/**
 * APIを通じてパーティを保存する
 */
export async function saveTeamToAPI(team: Team, overwrite = false): Promise<{ success: boolean; needsConfirmation?: boolean; existingTeamName?: string }> {
  try {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, overwrite })
    });

    const data = await response.json();

    if (data.success) {
      saveTeamToLocalStorage(team);
    }

    return data;
  } catch (error) {
    console.error('API save failed:', error);
    const result = saveTeamToLocalStorage(team);
    return result;
  }
}

/**
 * APIを通じて全パーティを取得する
 */
export async function getTeamsFromAPI(): Promise<Team[]> {
  try {
    const response = await fetch('/api/teams');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    console.error('API fetch failed:', error);
    return getTeamsFromLocalStorage();
  }
}

/**
 * APIを通じてパーティを削除する
 */
export async function deleteTeamFromAPI(teamId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: 'DELETE',
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
 */
export async function createShareLink(team: Team): Promise<{ shareUrl?: string; error?: string }> {
  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
 */
export async function migrateLocalStorageToKV(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const migrationKey = 'pokemon-app-migrated';

  if (localStorage.getItem(migrationKey)) {
    return false;
  }

  try {
    const localTeams = getTeamsFromLocalStorage();

    if (localTeams.length === 0) {
      localStorage.setItem(migrationKey, 'true');
      return false;
    }

    for (const team of localTeams) {
      const result = await saveTeamToAPI(team);
      if (!result.success && result.needsConfirmation) {
        await saveTeamToAPI(team, true);
      }
    }

    localStorage.setItem(migrationKey, 'true');
    console.log('Successfully migrated teams to cloud storage');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}
