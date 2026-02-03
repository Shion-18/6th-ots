import { Team } from '@/types/pokemon';

// パーティデータをBase64エンコード
export function encodeTeam(team: Team): string {
  try {
    const json = JSON.stringify(team);
    // Base64エンコード（日本語対応）
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return base64;
  } catch (error) {
    console.error('パーティのエンコードに失敗しました:', error);
    throw new Error('パーティデータのエンコードに失敗しました');
  }
}

// Base64デコードしてパーティデータを取得
export function decodeTeam(encodedData: string): Team {
  try {
    // Base64デコード（日本語対応）
    const json = decodeURIComponent(escape(atob(encodedData)));
    const team = JSON.parse(json) as Team;
    return team;
  } catch (error) {
    console.error('パーティのデコードに失敗しました:', error);
    throw new Error('パーティデータのデコードに失敗しました');
  }
}

// 共有用URLを生成
export function generateShareUrl(team: Team, baseUrl?: string): string {
  const encoded = encodeTeam(team);
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/view?data=${encodeURIComponent(encoded)}`;
}

// URLからパーティデータを取得
export function getTeamFromUrl(url: string): Team | null {
  try {
    const urlObj = new URL(url);
    const encodedData = urlObj.searchParams.get('data');

    if (!encodedData) {
      return null;
    }

    return decodeTeam(decodeURIComponent(encodedData));
  } catch (error) {
    console.error('URLからのパーティ取得に失敗しました:', error);
    return null;
  }
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
