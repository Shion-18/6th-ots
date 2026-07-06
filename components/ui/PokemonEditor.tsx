'use client';

import { useState, useEffect, useRef } from 'react';
import { Pokemon } from '@/types/pokemon';
import PokemonAutocomplete from './PokemonAutocomplete';
import MoveAutocomplete from './MoveAutocomplete';
import ItemAutocomplete from './ItemAutocomplete';
import TypeIcon from './TypeIcon';
import allPokemon from '@/data/all-pokemon.json';
import Image from 'next/image';
import { getCompetitiveItems, getMegaStonesForPokemon } from '@/lib/item-helpers';

interface PokemonEditorProps {
  pokemon: Pokemon | null;
  onSave: (pokemon: Pokemon) => void;
  onCancel: () => void;
}

export default function PokemonEditor({ pokemon, onSave, onCancel }: PokemonEditorProps) {
  interface PokemonData {
    id: number;
    name: string;
    nameEn: string;
    nameJa: string;
    sprite: string;
    types: string[];
    abilities: string[];
    megaOf?: number;
    formOf?: number;
  }

  interface MoveDetail {
    id: number;
    name: string;
    nameJa: string;
    type: string;
    category: string;
    power: number | null;
    accuracy: number | null;
    pp: number;
  }

  const [selectedSpecies, setSelectedSpecies] = useState<PokemonData | null>(null);
  const [availableMoves, setAvailableMoves] = useState<MoveDetail[]>([]);
  const [movesLoading, setMovesLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState(50);
  const [ability, setAbility] = useState('');
  const [item, setItem] = useState('');
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESCで閉じる & 開いたときに最初のフォーカス可能要素にフォーカス & 軽量フォーカストラップ
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const getFocusable = (): HTMLElement[] => {
      const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(dialog.querySelectorAll<HTMLElement>(selector));
    };

    // 開いた直後に最初のフォーカス可能要素にフォーカス
    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = getFocusable();
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const loadMovesForPokemon = async (pokemonId: number) => {
    setMovesLoading(true);
    try {
      const response = await fetch(`/api/pokemon-moves/${pokemonId}`);
      const data = await response.json();
      setAvailableMoves(data.moves || []);
    } catch (error) {
      console.error('Failed to load moves:', error);
      setAvailableMoves([]);
    } finally {
      setMovesLoading(false);
    }
  };

  // 既存のポケモンを編集する場合は初期値を設定
  useEffect(() => {
    if (pokemon) {
      const species = (allPokemon as PokemonData[]).find((p) => p.id === pokemon.speciesId);
      if (species) {
        setSelectedSpecies(species);
        setNickname(pokemon.nickname || '');
        setLevel(pokemon.level);
        setAbility(pokemon.ability);
        setItem(pokemon.item || '');
        setSelectedMoves(pokemon.moves);
        loadMovesForPokemon(species.id);
      }
    }
  }, [pokemon]);

  const handleSpeciesSelect = (species: PokemonData) => {
    setSelectedSpecies(species);
    setAbility(species.abilities[0]);
    setSelectedMoves([]);
    setValidationError(null);
    loadMovesForPokemon(species.id);
  };

  const handleMoveSelect = (moveName: string) => {
    if (selectedMoves.length < 4) {
      setSelectedMoves([...selectedMoves, moveName]);
      setValidationError(null);
    }
  };

  const handleMoveRemove = (moveName: string) => {
    setSelectedMoves(selectedMoves.filter((m) => m !== moveName));
  };

  const handleSave = () => {
    if (!selectedSpecies) {
      setValidationError('ポケモンを選択してください');
      return;
    }

    if (selectedMoves.length === 0) {
      setValidationError('技を最低1つ選択してください');
      return;
    }

    setValidationError(null);

    const newPokemon: Pokemon = {
      id: pokemon?.id || `${Date.now()}-${Math.random()}`,
      // メガフォームは基本種族IDで保存（メガストーンで表現）。フォーム違い(ロトム等)は
      // 自身のIDを保持してフォームが潰れないようにする。
      speciesId: selectedSpecies.megaOf ?? selectedSpecies.id,
      species: selectedSpecies.nameJa,
      nickname: nickname || undefined,
      level,
      ability,
      item: item || undefined,
      moves: selectedMoves,
    };

    onSave(newPokemon);
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pokemon-editor-title"
    >
      <div className="bg-card rounded-lg border border-line max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-accent text-white p-4 rounded-t-lg">
          <h2 id="pokemon-editor-title" className="text-xl sm:text-2xl font-bold">
            {pokemon ? 'ポケモンを編集' : 'ポケモンを追加'}
          </h2>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* ポケモン選択 */}
          {!selectedSpecies && (
            <div>
              <label className="block text-sm font-bold text-ink-muted mb-2">ポケモンを選択</label>
              <PokemonAutocomplete
                onSelect={handleSpeciesSelect}
                placeholder="ポケモン名で検索（日本語・英語対応）"
                selectedPokemon={selectedSpecies}
              />
            </div>
          )}

          {selectedSpecies && (
            <>
              {/* 選択中のポケモン */}
              <div className="bg-surface border border-line p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Image
                      src={selectedSpecies.sprite}
                      alt={selectedSpecies.nameJa}
                      width={64}
                      height={64}
                      className="pixelated"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-ink">{selectedSpecies.nameJa}</h3>
                      <div className="flex gap-1 mt-1">
                        {selectedSpecies.types.map((type) => (
                          <TypeIcon key={type} type={type} size="xs" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSpecies(null)}
                    className="text-sm text-accent hover:text-accent-strong font-medium"
                  >
                    変更
                  </button>
                </div>
              </div>

              {/* ニックネーム・レベル */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-ink-muted mb-2">ニックネーム（任意）</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Count full-width characters as 2, half-width as 1
                      let byteCount = 0;
                      for (let i = 0; i < value.length; i++) {
                        byteCount += value.charCodeAt(i) > 255 ? 2 : 1;
                        if (byteCount > 12) return;
                      }
                      setNickname(value);
                    }}
                    className="w-full px-4 py-2 border border-line rounded-lg focus:border-accent focus:outline-none"
                    placeholder={selectedSpecies.nameJa}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink-muted mb-2">レベル</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-line rounded-lg focus:border-accent focus:outline-none"
                  >
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((lv) => (
                      <option key={lv} value={lv}>{lv}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 特性・持ち物 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-ink-muted mb-2">特性</label>
                  <select
                    value={ability}
                    onChange={(e) => setAbility(e.target.value)}
                    className="w-full px-4 py-2 border border-line rounded-lg focus:border-accent focus:outline-none"
                  >
                    {selectedSpecies.abilities.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">持ち物</label>
                  <ItemAutocomplete
                    competitiveItems={getCompetitiveItems()}
                    megaStones={selectedSpecies ? getMegaStonesForPokemon(selectedSpecies.id) : []}
                    currentItem={item}
                    onSelectItem={setItem}
                    placeholder="持ち物を検索..."
                  />
                </div>
              </div>

              {/* 技選択 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-ink-muted">技 ({selectedMoves.length}/4)</label>
                </div>

                {/* 選択済みの技 */}
                {selectedMoves.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedMoves.map((moveName) => {
                      const moveDetail = availableMoves.find((m) => m.nameJa === moveName);
                      return (
                        <div
                          key={moveName}
                          className="border border-line rounded-lg px-3 py-2 bg-surface hover:border-ink-faint transition-colors flex items-center gap-2"
                        >
                          <span className="font-medium text-sm text-ink flex-1">{moveName}</span>
                          {moveDetail && (
                            <TypeIcon type={moveDetail.type} size="xs" className="flex-shrink-0" />
                          )}
                          <button
                            onClick={() => handleMoveRemove(moveName)}
                            className="ml-1 text-ink-faint hover:text-red-600 transition-colors flex-shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 技検索・追加 */}
                <MoveAutocomplete
                  availableMoves={availableMoves}
                  selectedMoves={selectedMoves}
                  onSelectMove={handleMoveSelect}
                  placeholder={
                    selectedMoves.length >= 4
                      ? '技は4つまでです'
                      : movesLoading
                      ? '技を読み込み中...'
                      : availableMoves.length > 0
                      ? '技を検索して追加...'
                      : 'ポケモンを選択すると技が表示されます'
                  }
                />

                {availableMoves.length > 0 && (
                  <p className="text-xs text-ink-faint mt-2">
                    このポケモンが覚える技: {availableMoves.length}種類
                  </p>
                )}
              </div>
            </>
          )}

          {/* バリデーションエラー */}
          {validationError && (
            <div
              role="alert"
              className="mt-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium"
            >
              {validationError}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-4 pt-4 border-t border-line">
            <button
              onClick={onCancel}
              className="flex-1 bg-card border border-line hover:bg-surface text-ink-muted font-bold py-3 px-6 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              data-testid="save-pokemon"
              onClick={handleSave}
              disabled={!selectedSpecies || selectedMoves.length === 0}
              className={`flex-1 font-bold py-3 px-6 rounded-lg transition-colors ${
                selectedSpecies && selectedMoves.length > 0
                  ? 'bg-accent hover:bg-accent-strong text-white'
                  : 'bg-line text-ink-faint cursor-not-allowed'
              }`}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
