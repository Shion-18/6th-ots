'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Team, Pokemon } from '@/types/pokemon';
import { getTeamFromLocalStorage, getTeamsFromLocalStorage } from '@/lib/team-encoder';
import { createShareUrl } from '@/lib/share';
import { saveTeamToAPI, SaveResult } from '@/lib/team-storage';
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
  // 新規作成時用の安定したID（マウント時に一度だけ生成）
  const [newTeamId] = useState(() => `team-${Date.now()}`);
  // 新規作成時の createdAt も一度だけ生成
  const [newTeamCreatedAt] = useState(() => new Date().toISOString());
  const { toasts, showToast, dismissToast } = useToast();
  // 未保存変更追跡: 初回ロード時のスナップショット
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);
  // 楽観ロック: 読み込んだ時点の updatedAt（保存時に baseUpdatedAt として送信）
  const [baseUpdatedAt, setBaseUpdatedAt] = useState<string | undefined>(undefined);
  // 競合検出モーダル用
  const [versionConflict, setVersionConflict] = useState<null | { currentTeam: Team }>(null);

  // 編集モードの初期化 — URLパラメータ + localStorage（外部入力）から状態を同期
  useEffect(() => {
    const teamIdParam = searchParams.get('teamId');
    if (!teamIdParam) {
      // 新規作成: 初期スナップショット = 空
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialSnapshot(JSON.stringify({ name: 'マイパーティ', pokemon: [] }));
      return;
    }

    const localTeam = getTeamFromLocalStorage(teamIdParam);
    if (localTeam) {
      // 外部状態（URL/localStorage）→ React stateの同期は意図的なsetState
      setEditingTeamId(teamIdParam);
      setIsEditMode(true);
      setTeamName(localTeam.name);
      setPokemon(localTeam.pokemon);
      setHasTeamNameBeenFocused(true);
      setBaseUpdatedAt(localTeam.updatedAt);
      setInitialSnapshot(JSON.stringify({ name: localTeam.name, pokemon: localTeam.pokemon }));
    } else {
      showToast('error', 'パーティが見つかりませんでした');
      router.push('/my-teams');
    }
  }, [searchParams, router, showToast]);

  // 未保存変更の有無
  const isDirty = useMemo(() => {
    if (isSaved) return false;
    if (!initialSnapshot) return false;
    const current = JSON.stringify({ name: teamName, pokemon });
    return current !== initialSnapshot;
  }, [teamName, pokemon, isSaved, initialSnapshot]);

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

  // 内部遷移ガード（未保存なら確認モーダルを挟む）
  const guardedNavigate = (navigate: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => navigate);
    } else {
      navigate();
    }
  };

  // 画像生成用のチームデータ（renderごとに新しい updatedAt を渡したい場合は
  // useImageGenerator 側で必要になった時点で生成する。ここではビュー目的のみ）
  const currentTeam: Team = {
    id: isEditMode && editingTeamId ? editingTeamId : newTeamId,
    name: teamName,
    pokemon,
    createdAt: isEditMode && editingTeamId
      ? getTeamFromLocalStorage(editingTeamId)?.createdAt || newTeamCreatedAt
      : newTeamCreatedAt,
    updatedAt: newTeamCreatedAt,
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

  // 保存結果の共通ハンドリング
  const handleSaveResult = (result: SaveResult) => {
    if (result.success) {
      if (result.savedTo === 'local') {
        // クラウド未保存（オフライン）。成功偽装せず警告する。
        setIsSaved(true);
        showToast('warning', 'オフラインのため端末内にのみ保存しました。オンライン時に再保存してください');
        return;
      }
      if (result.team?.updatedAt) setBaseUpdatedAt(result.team.updatedAt);
      setSavedTeams(getTeamsFromLocalStorage());
      setIsSaved(true);
      showToast('success', isEditMode ? 'パーティを更新しました' : 'パーティを保存しました');
      setTimeout(() => router.push('/my-teams'), 1000);
      return;
    }
    if (result.versionConflict) {
      if (result.currentTeam) {
        setVersionConflict({ currentTeam: result.currentTeam });
      } else {
        showToast('error', '他の端末で更新されています。最新を読み込んでください');
      }
      return;
    }
    showToast('error', result.error || '保存に失敗しました');
  };

  // パーティを保存（overwrite=true で楽観ロック/確認をスキップして強制上書き）
  const saveTeam = async (overwrite = false) => {
    if (pokemon.length === 0) {
      showToast('warning', 'パーティにポケモンを追加してください');
      return;
    }

    const team: Team = {
      id: isEditMode ? editingTeamId! : newTeamId,
      name: teamName || 'マイパーティ',
      pokemon,
      createdAt: isEditMode
        ? getTeamFromLocalStorage(editingTeamId!)?.createdAt || newTeamCreatedAt
        : newTeamCreatedAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      const result = await saveTeamToAPI(team, { baseUpdatedAt, overwrite });

      // 別パーティが既にある状態での新規保存 → 上書き確認
      if (result.needsConfirmation) {
        const confirmed = confirm(
          `既に「${result.existingTeamName}」が保存されています。\n新しいパーティを保存すると、既存のパーティは置き換えられます。\n\n上書きしてもよろしいですか？`
        );
        if (confirmed) {
          handleSaveResult(await saveTeamToAPI(team, { overwrite: true }));
        }
        return;
      }

      handleSaveResult(result);
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
      id: isEditMode && editingTeamId ? editingTeamId : newTeamId,
      name: teamName || 'マイパーティ',
      pokemon,
      createdAt: isEditMode && editingTeamId
        ? getTeamFromLocalStorage(editingTeamId)?.createdAt || newTeamCreatedAt
        : newTeamCreatedAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      const url = await createShareUrl(team);
      setShareUrl(url);
      setShowQRModal(true);
    } catch (error) {
      console.error('Share failed:', error);
      showToast('error', error instanceof Error ? error.message : '共有リンクの作成に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
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

      {/* QRコードモーダル */}
      {showQRModal && (
        <QRCodeDisplay
          url={shareUrl}
          teamName={teamName}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* 競合検出モーダル（他端末で更新済み） */}
      {versionConflict && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="conflict-title"
        >
          <div className="bg-card rounded-lg border border-line max-w-md w-full p-6">
            <h2 id="conflict-title" className="text-xl font-bold text-ink mb-2">
              他の端末で更新されています
            </h2>
            <p className="text-ink-muted text-sm mb-6">
              このパーティは別の端末/タブで保存されたようです。<br />
              どちらの内容を残しますか？
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const fresh = versionConflict.currentTeam;
                  setTeamName(fresh.name);
                  setPokemon(fresh.pokemon);
                  setBaseUpdatedAt(fresh.updatedAt);
                  setInitialSnapshot(JSON.stringify({ name: fresh.name, pokemon: fresh.pokemon }));
                  setVersionConflict(null);
                  showToast('info', '最新の内容を読み込みました');
                }}
                className="bg-accent hover:bg-accent-strong text-white font-bold py-3 px-4 rounded-lg"
              >
                最新を読み込む（自分の編集は破棄）
              </button>
              <button
                onClick={() => {
                  setVersionConflict(null);
                  saveTeam(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg"
              >
                自分の編集で上書き保存
              </button>
              <button
                onClick={() => setVersionConflict(null)}
                className="bg-surface border border-line hover:bg-line text-ink font-bold py-3 px-4 rounded-lg"
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
          <div className="bg-card rounded-lg border border-line max-w-md w-full p-6">
            <h2 id="unsaved-title" className="text-xl font-bold text-ink mb-2">
              保存されていない変更があります
            </h2>
            <p className="text-ink-muted text-sm mb-6">
              編集中の内容は破棄されます。本当にこのページを離れますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingNavigation(null)}
                className="flex-1 bg-surface border border-line hover:bg-line text-ink font-bold py-3 px-4 rounded-lg"
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg"
              >
                破棄して離れる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="bg-card border-b border-line">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-ink">
              {isEditMode ? 'パーティを編集' : 'パーティビルダー'}
            </h1>
            <button
              onClick={() => guardedNavigate(() => router.push('/'))}
              className="text-ink-muted hover:text-ink"
            >
              ← ホーム
            </button>
          </div>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value.slice(0, 30))}
            onFocus={handleTeamNameFocus}
            className="w-full px-4 py-2 border border-line rounded-lg focus:border-accent focus:outline-none"
            placeholder="パーティ名を入力"
            maxLength={30}
          />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ポケモン追加ボタン */}
        <div className="bg-card rounded-lg border border-line p-6 mb-6">
          <h2 className="text-lg font-bold text-ink mb-4">ポケモンを追加</h2>
          <button
            onClick={handleAddPokemon}
            disabled={pokemon.length >= 6}
            className={`w-full font-bold py-4 px-6 rounded-lg transition-colors ${
              pokemon.length >= 6
                ? 'bg-line text-ink-faint cursor-not-allowed'
                : 'bg-accent hover:bg-accent-strong text-white'
            }`}
          >
            ＋ ポケモンを追加 ({pokemon.length}/6)
          </button>
        </div>

        {/* パーティリスト */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-ink mb-4">
            パーティ ({pokemon.length}/6)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pokemon.map((p) => {
              const isBeingEdited = isEditorOpen && editingPokemon?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={isBeingEdited ? 'ring-2 ring-accent rounded-lg' : ''}
                >
                  <PokemonCard pokemon={p} />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditPokemon(p)}
                      aria-label={`${p.nickname || p.species}を編集`}
                      className="flex-1 bg-accent hover:bg-accent-strong text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeletePokemon(p.id)}
                      aria-label={`${p.nickname || p.species}を削除`}
                      className="flex-1 bg-card border border-line hover:bg-surface text-red-700 font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pokemon.length === 0 && (
            <div className="text-center py-12 bg-card rounded-lg border border-line">
              <p className="text-ink-muted text-lg">ポケモンが登録されていません</p>
              <p className="text-ink-faint text-sm mt-2">「ポケモンを追加」ボタンから追加してください</p>
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
                ? 'bg-line text-ink-faint cursor-not-allowed'
                : 'bg-accent hover:bg-accent-strong text-white'
            }`}
          >
            保存
          </button>
          <button
            onClick={shareTeam}
            disabled={pokemon.length === 0}
            className={`font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base ${
              pokemon.length === 0
                ? 'bg-line text-ink-faint cursor-not-allowed'
                : 'bg-card border border-line hover:bg-surface text-ink'
            }`}
          >
            QRコード表示
          </button>
          <button
            onClick={generateImage}
            disabled={pokemon.length === 0 || isGenerating}
            className={`font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base ${
              pokemon.length === 0 || isGenerating
                ? 'bg-line text-ink-faint cursor-not-allowed'
                : 'bg-card border border-line hover:bg-surface text-ink'
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
            className="bg-card border border-line hover:bg-surface text-ink-muted font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
          >
            リセット
          </button>
        </div>

        {/* 説明 */}
        <div className="bg-surface border border-line rounded-lg p-4">
          <h3 className="font-bold text-ink mb-2">使い方</h3>
          <ol className="text-sm text-ink-muted space-y-1 list-decimal list-inside">
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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-ink-muted">読み込み中...</p>
        </div>
      </div>
    }>
      <BuilderPageContent />
    </Suspense>
  );
}
