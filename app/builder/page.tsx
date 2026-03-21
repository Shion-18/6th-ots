'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Team, Pokemon } from '@/types/pokemon';
import { getTeamFromLocalStorage, getTeamsFromLocalStorage } from '@/lib/team-encoder';
import { saveTeamToAPI, createShareLink } from '@/lib/team-storage';
import PokemonCard from '@/components/ui/PokemonCard';
import PokemonEditor from '@/components/ui/PokemonEditor';
import TeamImageView from '@/components/ui/TeamImageView';
import { useImageGenerator } from '@/hooks/useImageGenerator';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';

function BuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teamName, setTeamName] = useState('マイパーティ');
  const [hasTeamNameBeenFocused, setHasTeamNameBeenFocused] = useState(false);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [editingPokemon, setEditingPokemon] = useState<Pokemon | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [savedTeams, setSavedTeams] = useState<Team[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 編集モードの初期化
  useEffect(() => {
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // 編集モード
      const team = getTeamFromLocalStorage(teamId);

      if (team) {
        setEditingTeamId(teamId);
        setIsEditMode(true);
        setTeamName(team.name);
        setPokemon(team.pokemon);
        setHasTeamNameBeenFocused(true);
      } else {
        alert('パーティが見つかりませんでした');
        router.push('/my-teams');
      }
    }
  }, [searchParams, router]);

  // 画像生成用のチームデータ
  const currentTeam: Team = {
    id: isEditMode ? editingTeamId! : `team-${Date.now()}`,
    name: teamName,
    pokemon,
    createdAt: isEditMode
      ? getTeamFromLocalStorage(editingTeamId!)?.createdAt || new Date().toISOString()
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    format: 'singles',
  };

  const { imageRef, isGenerating, generateImage } = useImageGenerator(currentTeam);

  const handleAddPokemon = () => {
    if (pokemon.length >= 6) {
      alert('パーティは最大6体までです');
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
  const saveTeam = async () => {
    if (pokemon.length === 0) {
      alert('パーティにポケモンを追加してください');
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
      format: 'singles',
    };

    try {
      const result = await saveTeamToAPI(team);

      // 編集モードの場合は確認不要
      if (isEditMode) {
        if (result.success) {
          alert('パーティを更新しました！');
          router.push('/my-teams');
        } else {
          alert('更新に失敗しました');
        }
        return;
      }

      // 新規作成モードのロジック
      if (result.needsConfirmation) {
        const confirmed = confirm(
          `既に「${result.existingTeamName}」が保存されています。\n新しいパーティを保存すると、既存のパーティは削除されます。\n\n上書きしてもよろしいですか？`
        );

        if (confirmed) {
          // overwriteフラグ付きで再送信
          const overwriteResult = await saveTeamToAPI(team, true);
          if (overwriteResult.success) {
            setSavedTeams(getTeamsFromLocalStorage());
            alert('パーティを保存しました！');
            router.push('/my-teams');
          } else {
            alert('保存に失敗しました');
          }
        }
      } else if (result.success) {
        setSavedTeams(getTeamsFromLocalStorage());
        alert('パーティを保存しました！');
        router.push('/my-teams');
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存に失敗しました');
    }
  };

  // パーティを共有
  const shareTeam = async () => {
    if (pokemon.length === 0) {
      alert('パーティにポケモンを追加してください');
      return;
    }

    const team: Team = {
      id: `team-${Date.now()}`,
      name: teamName,
      pokemon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      format: 'singles',
    };

    try {
      const result = await createShareLink(team);
      if (result.shareUrl) {
        setShareUrl(result.shareUrl);
        setShowQRModal(true);
      } else {
        alert(result.error || '共有リンクの作成に失敗しました');
      }
    } catch (error) {
      console.error('Share failed:', error);
      alert('共有リンクの作成に失敗しました');
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

      {/* ヘッダー */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'パーティを編集' : 'パーティビルダー'}
            </h1>
            <button
              onClick={() => router.push('/')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pokemon.map((p) => (
              <div key={p.id}>
                <PokemonCard pokemon={p} />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditPokemon(p)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                  >
                    ✎ 編集
                  </button>
                  <button
                    onClick={() => handleDeletePokemon(p.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                  >
                    × 削除
                  </button>
                </div>
              </div>
            ))}
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
            onClick={saveTeam}
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
