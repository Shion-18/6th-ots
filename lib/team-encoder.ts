import { Team } from '@/types/pokemon';

/**
 * 共有用URLを生成する。
 * サーバに POST /api/share してスナップショット保存 → 短縮URL `/view/<shortId>` を返す。
 */
export async function generateShareUrl(team: Team, baseUrl?: string): Promise<string> {
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || '共有リンクの作成に失敗しました');
  }

  const data = await response.json();
  if (!data.success || !data.shortId) {
    throw new Error(data.error || '共有リンクの作成に失敗しました');
  }

  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/view/${data.shortId}`;
}

// LocalStorageにパーティを保存
export function saveTeamToLocalStorage(team: Team): { success: boolean; needsConfirmation: boolean; existingTeamName?: string } {
  if (typeof window === 'undefined') {
    return { success: false, needsConfirmation: false };
  }

  try {
    const teams = getTeamsFromLocalStorage();
    const index = teams.findIndex(t => t.id === team.id);

    if (index >= 0) {
      // 既存パーティの更新（制限チェック不要）
      teams[index] = team;
    } else {
      // 新規パーティの保存
      if (teams.length >= 1) {
        // 既に1つパーティが存在する場合、確認が必要
        return {
          success: false,
          needsConfirmation: true,
          existingTeamName: teams[0].name,
        };
      }
      teams.push(team);
    }

    localStorage.setItem('pokemon-teams', JSON.stringify(teams));
    return { success: true, needsConfirmation: false };
  } catch (error) {
    console.error('LocalStorageへの保存に失敗しました:', error);
    return { success: false, needsConfirmation: false };
  }
}

// LocalStorageのパーティを上書き保存
export function overwriteTeamInLocalStorage(newTeam: Team): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 既存のパーティを全て削除して新規保存
    const teams = [newTeam];
    localStorage.setItem('pokemon-teams', JSON.stringify(teams));
    return true;
  } catch (error) {
    console.error('LocalStorageへの上書き保存に失敗しました:', error);
    return false;
  }
}

// LocalStorageから全パーティを取得
export function getTeamsFromLocalStorage(): Team[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem('pokemon-teams');
    if (!data) return [];
    return JSON.parse(data) as Team[];
  } catch (error) {
    console.error('LocalStorageからの取得に失敗しました:', error);
    return [];
  }
}

// LocalStorageから特定のパーティを取得
export function getTeamFromLocalStorage(teamId: string): Team | null {
  const teams = getTeamsFromLocalStorage();
  return teams.find(t => t.id === teamId) || null;
}

// LocalStorageからパーティを削除
export function deleteTeamFromLocalStorage(teamId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const teams = getTeamsFromLocalStorage();
    const filtered = teams.filter(t => t.id !== teamId);
    localStorage.setItem('pokemon-teams', JSON.stringify(filtered));
  } catch (error) {
    console.error('LocalStorageからの削除に失敗しました:', error);
  }
}
