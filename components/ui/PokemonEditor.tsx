'use client';

import { useState, useEffect } from 'react';
import { Pokemon } from '@/types/pokemon';
import PokemonAutocomplete from './PokemonAutocomplete';
import MoveAutocomplete from './MoveAutocomplete';
import allPokemon from '@/data/all-pokemon.json';
import pokemonMoves from '@/data/pokemon-moves.json';
import items from '@/data/items.json';
import Image from 'next/image';

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
    baseStats: {
      hp: number;
      attack: number;
      defense: number;
      spAttack: number;
      spDefense: number;
      speed: number;
    };
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

  interface PokemonMovesData {
    pokemonId: number;
    pokemonName: string;
    moves: MoveDetail[];
  }

  const [selectedSpecies, setSelectedSpecies] = useState<PokemonData | null>(null);
  const [availableMoves, setAvailableMoves] = useState<MoveDetail[]>([]);
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState(50);
  const [ability, setAbility] = useState('');
  const [item, setItem] = useState('');
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);

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

        // Load available moves for this Pokemon
        const movesData = (pokemonMoves as PokemonMovesData[]).find(
          (pm) => pm.pokemonId === species.id
        );
        if (movesData) {
          setAvailableMoves(movesData.moves);
        }
      }
    }
  }, [pokemon]);

  const handleSpeciesSelect = (species: PokemonData) => {
    setSelectedSpecies(species);
    setAbility(species.abilities[0]);

    // Load available moves for this Pokemon
    const movesData = (pokemonMoves as PokemonMovesData[]).find(
      (pm) => pm.pokemonId === species.id
    );
    if (movesData) {
      setAvailableMoves(movesData.moves);
    } else {
      setAvailableMoves([]);
    }

    // Reset selected moves when changing Pokemon
    setSelectedMoves([]);
  };

  const handleMoveSelect = (moveName: string) => {
    if (selectedMoves.length < 4) {
      setSelectedMoves([...selectedMoves, moveName]);
    }
  };

  const handleMoveRemove = (moveName: string) => {
    setSelectedMoves(selectedMoves.filter((m) => m !== moveName));
  };

  const handleSave = () => {
    if (!selectedSpecies) {
      alert('ポケモンを選択してください');
      return;
    }

    if (selectedMoves.length === 0) {
      alert('技を最低1つ選択してください');
      return;
    }

    const newPokemon: Pokemon = {
      id: pokemon?.id || `${Date.now()}-${Math.random()}`,
      speciesId: selectedSpecies.megaOf || selectedSpecies.formOf || selectedSpecies.id,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {pokemon ? 'ポケモンを編集' : 'ポケモンを追加'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* ポケモン選択 */}
          {!selectedSpecies && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ポケモンを選択</label>
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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
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
                      <h3 className="text-xl font-bold text-gray-800">{selectedSpecies.nameJa}</h3>
                      <div className="flex gap-1 mt-1">
                        {selectedSpecies.types.map((type) => (
                          <span key={type} className="text-xs px-2 py-0.5 rounded bg-white text-gray-700">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSpecies(null)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    変更
                  </button>
                </div>
              </div>

              {/* ニックネーム・レベル */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ニックネーム（任意）</label>
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder={selectedSpecies.nameJa}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">レベル</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">特性</label>
                  <select
                    value={ability}
                    onChange={(e) => setAbility(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    {selectedSpecies.abilities.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">持ち物</label>
                  <select
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">なし</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.name}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 技選択 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-700">技 ({selectedMoves.length}/4)</label>
                </div>

                {/* 選択済みの技 */}
                {selectedMoves.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedMoves.map((moveName) => {
                      const moveDetail = availableMoves.find((m) => m.nameJa === moveName);
                      return (
                        <div
                          key={moveName}
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                          <span className="font-medium text-sm">{moveName}</span>
                          {moveDetail && (
                            <span className="text-xs opacity-80">
                              {moveDetail.type}
                            </span>
                          )}
                          <button
                            onClick={() => handleMoveRemove(moveName)}
                            className="ml-1 hover:bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center"
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
                      : availableMoves.length > 0
                      ? '技を検索して追加...'
                      : 'ポケモンを選択すると技が表示されます'
                  }
                />

                {availableMoves.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    このポケモンが覚える技: {availableMoves.length}種類
                  </p>
                )}
              </div>
            </>
          )}

          {/* アクションボタン */}
          <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedSpecies || selectedMoves.length === 0}
              className={`flex-1 font-bold py-3 px-6 rounded-lg transition-colors ${
                selectedSpecies && selectedMoves.length > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
