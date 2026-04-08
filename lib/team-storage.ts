import { Team } from '@/types/pokemon';
import { getTeamsFromLocalStorage, saveTeamToLocalStorage } from './team-encoder';

export type SaveDestination = 'cloud' | 'local' | 'failed';

export interface SaveResult {
  success: boolean;
  savedTo: SaveDestination;
  needsConfirmation?: boolean;
  existingTeamName?: string;
  error?: string;
  team?: Team; // サーバーから返されたチーム（version更新済み）
  serverTeam?: Team; // 競合時のサーバー側チーム
}

/**
 * APIを通じてパーティを保存する
 */
export async function saveTeamToAPI(team: Team, overwrite = false): Promise<SaveResult> {
  try {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, overwrite })
    });

    const data = await response.json();

    if (data.success) {
      // KV保存成功 → localStorageにもバックアップ
      const savedTeam = data.team || team;
      saveTeamToLocalStorage(savedTeam);
      return { success: true, savedTo: 'cloud', team: savedTeam };
    }

    if (data.needsConfirmation) {
      return { success: false, savedTo: 'failed', needsConfirmation: true, existingTeamName: data.existingTeamName };
    }

    if (data.error === 'conflict') {
      return { success: false, savedTo: 'failed', error: 'conflict', serverTeam: data.serverTeam };
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
 * - KVにデータがあればupdatedAtを比較し、新しい方を採用
 * - KVが空ならlocalStorageのデータをそのまま移行
 */
export async function migrateLocalStorageToKV(): Promise<{ migrated: boolean; source?: 'local' | 'cloud' }> {
  if (typeof window === 'undefined') return { migrated: false };

  const migrationKey = 'pokemon-app-migrated-v2';

  if (localStorage.getItem(migrationKey)) {
    return { migrated: false };
  }

  try {
    const localTeams = getTeamsFromLocalStorage();
    let cloudTeams: Team[] = [];

    try {
      cloudTeams = await getTeamsFromAPI();
    } catch {
      // API障害時はマイグレーションをスキップ（次回再試行）
      return { migrated: false };
    }

    if (localTeams.length === 0 && cloudTeams.length === 0) {
      localStorage.setItem(migrationKey, 'true');
      return { migrated: false };
    }

    // KVにデータがなく、localStorageにある → アップロード
    if (cloudTeams.length === 0 && localTeams.length > 0) {
      const result = await saveTeamToAPI(localTeams[0]);
      if (result.success) {
        localStorage.setItem(migrationKey, 'true');
        return { migrated: true, source: 'local' };
      }
      return { migrated: false };
    }

    // 両方にデータがある → updatedAtを比較して新しい方を採用
    if (cloudTeams.length > 0 && localTeams.length > 0) {
      const cloudLatest = new Date(cloudTeams[0].updatedAt).getTime();
      const localLatest = new Date(localTeams[0].updatedAt).getTime();

      if (localLatest > cloudLatest) {
        // ローカルが新しい → KVに上書き
        const localTeam = { ...localTeams[0], version: (cloudTeams[0].version ?? 0) + 1 };
        await saveTeamToAPI(localTeam, true);
      } else {
        // クラウドが新しいか同じ → localStorageを更新
        saveTeamToLocalStorage(cloudTeams[0]);
      }
    }

    // KVにだけデータがある → localStorageにバックアップ
    if (cloudTeams.length > 0 && localTeams.length === 0) {
      saveTeamToLocalStorage(cloudTeams[0]);
    }

    localStorage.setItem(migrationKey, 'true');
    return { migrated: true, source: cloudTeams.length > 0 ? 'cloud' : 'local' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { migrated: false };
  }
}
