'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Team, Pokemon } from '@/types/pokemon';
import { getTeamFromLocalStorage, getTeamsFromLocalStorage, generateShareUrl } from '@/lib/team-encoder';
import { saveTeamToAPI } from '@/lib/team-storage';
import PokemonCard from '@/components/ui/PokemonCard';
import PokemonEditor from '@/components/ui/PokemonEditor';
import TeamImageView from '@/components/ui/TeamImageView';
import { useImageGenerator } from '@/hooks/useImageGenerator';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';
import { useToast, ToastContainer } from '@/components/ui/Toast';

function BuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teamName, setTeamName] = useState('マイパーティ');
  const [hasTeamNameBeenFocused, setHasTeamNameBeenFocused] = useState(false);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [editingPokemon, setEditingPokemon] = useState<Pokemon | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [, setSavedTeams] = useState<Team[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVersion, setEditingVersion] = useState(0);
  const [versionConflict, setVersionConflict] = useState<null | { currentTeam: Team }>(null);
  const { toasts, showToast, dismissToast } = useToast();
  // 未保存変更追跡: 初回ロード時のスナップショットを保持
  const initialSnapshotRef = useRef<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);

  // 編集モードの初期化 — localStorageから読み込み
  useEffect(() => {
    const teamIdParam = searchParams.get('teamId');
    if (!teamIdParam) {
      // 新規作成: 初期スナップショット = 空
      initialSnapshotRef.current = JSON.stringify({ name: 'マイパーティ', pokemon: [] });
      return;
    }

    const localTeam = getTeamFromLocalStorage(teamIdParam);
    if (localTeam) {
      setEditingTeamId(teamIdParam);
      setIsEditMode(true);
      setTeamName(localTeam.name);
      setPokemon(localTeam.pokemon);
      setEditingVersion(localTeam.version ?? 0);
      setHasTeamNameBeenFocused(true);
      initialSnapshotRef.current = JSON.stringify({ name: localTeam.name, pokemon: localTeam.pokemon });
    } else {
      showToast('error', 'パーティが見つかりませんでした');
      router.push('/my-teams');
    }
  }, [searchParams, router, showToast]);

  const isDirty = useMemo(() => {
    if (isSaved) return false;
    if (!initialSnapshotRef.current) return false;
    const current = JSON.stringify({ name: teamName, pokemon });
    return current !== initialSnapshotRef.current;
  }, [teamName, pokemon, isSaved]);

  // ブラウザを閉じる/リロードする際の警告
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ホーム等の内部遷移ガード
  const guardedNavigate = (navigate: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => navigate);
    } else {
      navigate();
    }
  };

  // 画像生成用のチームデータ
  const currentTeam: Team = {
    id: isEditMode ? editingTeamId! : `team-${Date.now()}`,
    name: teamName,
    pokemon,
    createdAt: isEditMode
      ? getTeamFromLocalStorage(editingTeamId!)?.createdAt || new Date().toISOString()
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { imageRef, isGenerating, generateImage } = useImageGenerator(currentTeam);

  const handleAddPokemon = () => {
    if (pokemon.length >= 6) {
      showToast('warning', 'パーティは最大6体までです');
      return;
    }
    setEditingPokemon(null);
    setIsEditorOpen(true);
  };

  const handleEditPokemon = (p: Pokemon) => {
    setEditingPokemon(p);
    setIsEditorOpen(true);
  };

  const handleSavePokemon = (p: Pokemon) => {
    if (editingPokemon) {
      setPokemon(pokemon.map((existing) => (existing.id === p.id ? p : existing)));
    } else {
      setPokemon([...pokemon, p]);
    }
    setIsEditorOpen(false);
    setEditingPokemon(null);
  };

  const handleDeletePokemon = (id: string) => {
    if (confirm('このポケモンを削除しますか?')) {
      setPokemon(pokemon.filter((p) => p.id !== id));
    }
  };

  const handleTeamNameFocus = () => {
    if (!hasTeamNameBeenFocused && teamName === 'マイパーティ') {
      setTeamName('');
      setHasTeamNameBeenFocused(true);
    }
  };

  // パーティを保存
  const saveTeam = async (force = false) => {
    if (pokemon.length === 0) {
      showToast('warning', 'パーティにポケモンを追加してください');
      return;
    }

    const team: Team = {
      id: isEditMode ? editingTeamId! : `team-${Date.now()}`,
      name: teamName || 'マイパーティ',
      pokemon,
      createdAt: isEditMode
        ? getTeamFromLocalStorage(editingTeamId!)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: isEditMode ? editingVersion : 0,
    };

    try {
      const result = await saveTeamToAPI(team, false, force);

      // 編集モードの場合は確認不要
      if (isEditMode) {
        if (result.success) {
          if (result.team) setEditingVersion(result.team.version ?? editingVersion + 1);
          setIsSaved(true);
          showToast('success', 'パーティを更新しました');
          setTimeout(() => router.push('/my-teams'), 1000);
        } else if (result.versionConflict && result.currentTeam) {
          setVersionConflict({ currentTeam: result.currentTeam });
        } else {
          showToast('error', '更新に失敗しました');
        }
        return;
      }

      // 新規作成モードのロジック
      if (result.needsConfirmation) {
        const confirmed = confirm(
          `既に「${result.existingTeamName}」が保存されています。\n新しいパーティを保存すると、既存のパーティは削除されます。\n\n上書きしてもよろしいですか？`
        );

        if (confirmed) {
          const overwriteResult = await saveTeamToAPI(team, true, force);
          if (overwriteResult.success) {
            setSavedTeams(getTeamsFromLocalStorage());
            setIsSaved(true);
            showToast('success', 'パーティを保存しました');
            setTimeout(() => router.push('/my-teams'), 1000);
          } else {
            showToast('error', '保存に失敗しました');
          }
        }
      } else if (result.success) {
        setSavedTeams(getTeamsFromLocalStorage());
        setIsSaved(true);
        showToast('success', 'パーティを保存しました');
        setTimeout(() => router.push('/my-teams'), 1000);
      } else {
        showToast('error', result.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Save failed:', error);
      showToast('error', '保存に失敗しました');
    }
  };

  // パーティを共有
  const shareTeam = async () => {
    if (pokemon.length === 0) {
      showToast('warning', 'パーティにポケモンを追加してください');
      return;
    }

    const team: Team = {
      id: `team-${Date.now()}`,
      name: teamName,
      pokemon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const url = await generateShareUrl(team);
      setShareUrl(url);
      setShowQRModal(true);
    } catch (error) {
      console.error('Share failed:', error);
      showToast('error', error instanceof Error ? error.message : '共有リンクの作成に失敗しました');
    }
  };

  const loadTeam = (team: Team) => {
    if (confirm(`「${team.name}」を読み込みますか？\n現在の編集内容は失われます。`)) {
      setTeamName(team.name);
      setPokemon(team.pokemon);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* エディタモーダル */}
      {isEditorOpen && (
        <PokemonEditor
          pokemon={editingPokemon}
          onSave={handleSavePokemon}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingPokemon(null);
          }}
        />
      )}

      {/* 競合検出モーダル */}
      {versionConflict && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="conflict-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 id="conflict-title" className="text-xl font-bold text-gray-800 mb-2">
              他の端末で更新されています
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              このパーティは別の端末/タブで保存されたようです。<br />
              どちらの内容を残しますか？
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const fresh = versionConflict.currentTeam;
                  setTeamName(fresh.name);
                  setPokemon(fresh.pokemon);
                  setEditingVersion(fresh.version ?? 0);
                  initialSnapshotRef.current = JSON.stringify({ name: fresh.name, pokemon: fresh.pokemon });
                  setVersionConflict(null);
                  showToast('info', '最新の内容を読み込みました');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg"
              >
                最新を読み込む（自分の編集は破棄）
              </button>
              <button
                onClick={() => {
                  setVersionConflict(null);
                  saveTeam(true);
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg"
              >
                自分の編集で上書き保存
              </button>
              <button
                onClick={() => setVersionConflict(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 未保存変更警告モーダル */}
      {pendingNavigation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 id="unsaved-title" className="text-xl font-bold text-gray-800 mb-2">
              保存されていない変更があります
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              編集中の内容は破棄されます。本当にこのページを離れますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingNavigation(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg"
              >
                編集に戻る
              </button>
              <button
                onClick={() => {
                  const fn = pendingNavigation;
                  setPendingNavigation(null);
                  setIsSaved(true);
                  fn();
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg"
              >
                破棄して離れる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRコードモーダル */}
      {showQRModal && (
        <QRCodeDisplay
          url={shareUrl}
          teamName={teamName}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* ヘッダー */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'パーティを編集' : 'パーティビルダー'}
            </h1>
            <button
              onClick={() => guardedNavigate(() => router.push('/'))}
              className="text-gray-600 hover:text-gray-800"
            >
              ← ホーム
            </button>
          </div>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value.slice(0, 30))}
            onFocus={handleTeamNameFocus}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            placeholder="パーティ名を入力"
            maxLength={30}
          />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ポケモン追加ボタン */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">ポケモンを追加</h2>
          <button
            onClick={handleAddPokemon}
            disabled={pokemon.length >= 6}
            className={`w-full font-bold py-4 px-6 rounded-lg transition-colors ${
              pokemon.length >= 6
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white'
            }`}
          >
            ＋ ポケモンを追加 ({pokemon.length}/6)
          </button>
        </div>

        {/* パーティリスト */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            パーティ ({pokemon.length}/6)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pokemon.map((p) => {
              const isBeingEdited = isEditorOpen && editingPokemon?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={isBeingEdited ? 'ring-2 ring-blue-500 rounded-2xl' : ''}
                >
                  <PokemonCard pokemon={p} />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditPokemon(p)}
                      aria-label={`${p.nickname || p.species}を編集`}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                      ✎ 編集
                    </button>
                    <button
                      onClick={() => handleDeletePokemon(p.id)}
                      aria-label={`${p.nickname || p.species}を削除`}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                      × 削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pokemon.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <p className="text-gray-500 text-lg">ポケモンが登録されていません</p>
              <p className="text-gray-400 text-sm mt-2">「ポケモンを追加」ボタンから追加してください</p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <button
            data-testid="save-team"
            onClick={() => saveTeam()}
            disabled={pokemon.length === 0}
            className={`font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base ${
              pokemon.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            保存
          </button>
          <button
            onClick={shareTeam}
            disabled={pokemon.length === 0}
            className={`font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base ${
              pokemon.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            QRコード表示
          </button>
          <button
            onClick={generateImage}
            disabled={pokemon.length === 0 || isGenerating}
            className={`font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base ${
              pokemon.length === 0 || isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isGenerating ? '生成中...' : '画像として保存'}
          </button>
          <button
            onClick={() => {
              if (confirm('パーティをリセットしますか？')) {
                setPokemon([]);
                setTeamName('マイパーティ');
                setHasTeamNameBeenFocused(false);
              }
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
          >
            リセット
          </button>
        </div>

        {/* 説明 */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <h3 className="font-bold text-blue-800 mb-2">使い方</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>「ポケモンを追加」からポケモンを選択・詳細設定（最大6体）</li>
            <li>「保存」ボタンでローカルに保存（自分だけが見られる）</li>
            <li>「共有URL生成」で対戦相手に送るURLを生成</li>
            <li>「画像として保存」でパーティを画像化してダウンロード</li>
            <li>相手からもらったURLを開いて、相手のパーティを確認</li>
          </ol>
        </div>
      </div>

      {/* 非表示の画像生成用ビュー */}
      {pokemon.length > 0 && (
        <div className="hidden">
          <TeamImageView team={currentTeam} elementRef={imageRef} />
        </div>
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <BuilderPageContent />
    </Suspense>
  );
}
