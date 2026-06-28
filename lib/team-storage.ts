import { Team } from '@/types/pokemon';
import { getTeamsFromLocalStorage, saveTeamToLocalStorage } from './team-encoder';

export type SaveDestination = 'cloud' | 'local' | 'failed';

export interface SaveOptions {
  // 楽観ロック: クライアントが読み込んだ時点の updatedAt
  baseUpdatedAt?: string;
  // 強制上書き（競合検出/確認をスキップ）
  overwrite?: boolean;
}

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
 * APIを通じてパーティを保存する。
 * - 成功時はクラウド保存（savedTo:'cloud'）＋ localStorage バックアップ。
 * - 楽観ロック競合は versionConflict:true + currentTeam を返す。
 * - ネットワーク障害時のみ localStorage に退避（savedTo:'local'）。
 *   この場合 success:true だが「クラウド未保存」なので呼び出し側で警告すること。
 */
export async function saveTeamToAPI(team: Team, opts: SaveOptions = {}): Promise<SaveResult> {
  try {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, overwrite: opts.overwrite ?? false, baseUpdatedAt: opts.baseUpdatedAt })
    });

    const data = await response.json();

    if (data.success) {
      // クラウド保存成功 → localStorageにもバックアップ
      const savedTeam = data.team || team;
      saveTeamToLocalStorage(savedTeam);
      return { success: true, savedTo: 'cloud', team: savedTeam };
    }

    // 楽観ロック競合（他端末が先に更新）
    if (data.code === 'VERSION_CONFLICT') {
      return { success: false, savedTo: 'failed', versionConflict: true, currentTeam: data.currentTeam };
    }

    if (data.needsConfirmation) {
      return { success: false, savedTo: 'failed', needsConfirmation: true, existingTeamName: data.existingTeamName };
    }

    return { success: false, savedTo: 'failed', error: data.error || '保存に失敗しました' };
  } catch (error) {
    // ネットワーク障害 → localStorageにフォールバック（クラウド未保存。呼び出し側で警告）
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

