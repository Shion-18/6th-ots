import { Team } from '@/types/pokemon';
import { getTeamsFromLocalStorage, saveTeamToLocalStorage } from './team-encoder';

export type SaveDestination = 'cloud' | 'local' | 'failed';

export interface SaveResult {
  success: boolean;
  savedTo: SaveDestination;
  needsConfirmation?: boolean;
  existingTeamName?: string;
  versionConflict?: boolean;
  currentTeam?: Team;
  error?: string;
  team?: Team;
}

/**
 * APIを通じてパーティを保存する（失敗時はlocalStorageにフォールバック）
 * @param force true の場合は楽観ロックチェックをスキップして強制上書き
 */
export async function saveTeamToAPI(team: Team, overwrite = false, force = false): Promise<SaveResult> {
  try {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, overwrite, force })
    });

    const data = await response.json();

    if (data.success) {
      // KV保存成功 → localStorageにもバックアップ
      const savedTeam = data.team || team;
      saveTeamToLocalStorage(savedTeam);
      return { success: true, savedTo: 'cloud', team: savedTeam };
    }

    if (data.code === 'VERSION_CONFLICT') {
      return {
        success: false,
        savedTo: 'failed',
        versionConflict: true,
        currentTeam: data.currentTeam,
      };
    }

    if (data.needsConfirmation) {
      return { success: false, savedTo: 'failed', needsConfirmation: true, existingTeamName: data.existingTeamName };
    }

    return { success: false, savedTo: 'failed', error: data.error || '保存に失敗しました' };
  } catch (error) {
    // ネットワーク障害 → localStorageにフォールバック
    console.error('API save failed, falling back to localStorage:', error);
    saveTeamToLocalStorage(team);
    return { success: true, savedTo: 'local', team };
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

