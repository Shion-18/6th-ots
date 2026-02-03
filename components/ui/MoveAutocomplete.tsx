'use client';

import { useState, useEffect, useRef } from 'react';

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

interface MoveAutocompleteProps {
  availableMoves: MoveDetail[];
  selectedMoves: string[];
  onSelectMove: (moveName: string) => void;
  placeholder?: string;
}

export default function MoveAutocomplete({
  availableMoves,
  selectedMoves,
  onSelectMove,
  placeholder = '技を検索...',
}: MoveAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMoves, setFilteredMoves] = useState<MoveDetail[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMoves([]);
      setIsOpen(false);
      return;
    }

    const filtered = availableMoves.filter((move) => {
      // Exclude already selected moves
      if (selectedMoves.includes(move.nameJa)) {
        return false;
      }

      const searchLower = searchTerm.toLowerCase();
      return (
        move.nameJa.includes(searchTerm) ||
        move.name.toLowerCase().includes(searchLower) ||
        move.type.includes(searchTerm)
      );
    });

    setFilteredMoves(filtered.slice(0, 10)); // Show max 10 results
    setIsOpen(filtered.length > 0);
    setHighlightedIndex(0);
  }, [searchTerm, availableMoves, selectedMoves]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (move: MoveDetail) => {
    onSelectMove(move.nameJa);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredMoves.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredMoves[highlightedIndex]) {
          handleSelect(filteredMoves[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'ノーマル': 'bg-gray-400',
      'ほのお': 'bg-red-500',
      'みず': 'bg-blue-500',
      'でんき': 'bg-yellow-400',
      'くさ': 'bg-green-500',
      'こおり': 'bg-cyan-400',
      'かくとう': 'bg-orange-600',
      'どく': 'bg-purple-500',
      'じめん': 'bg-yellow-600',
      'ひこう': 'bg-indigo-400',
      'エスパー': 'bg-pink-500',
      'むし': 'bg-lime-500',
      'いわ': 'bg-yellow-700',
      'ゴースト': 'bg-purple-700',
      'ドラゴン': 'bg-indigo-600',
      'あく': 'bg-gray-800',
      'はがね': 'bg-gray-500',
      'フェアリー': 'bg-pink-300',
    };
    return colors[type] || 'bg-gray-400';
  };

  const getCategoryIcon = (category: string): string => {
    if (category === '物理') return '💥';
    if (category === '特殊') return '✨';
    if (category === '変化') return '🔄';
    return '◯';
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (filteredMoves.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={selectedMoves.length >= 4}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {isOpen && filteredMoves.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-[300px] overflow-y-auto"
        >
          {filteredMoves.map((move, index) => (
            <button
              key={move.id}
              onClick={() => handleSelect(move)}
              className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 text-left ${
                index === highlightedIndex ? 'bg-blue-100' : ''
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="text-lg">{getCategoryIcon(move.category)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm">
                    {move.nameJa}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded text-white ${getTypeColor(move.type)}`}>
                    {move.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {move.category}
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-gray-600 mt-0.5">
                  {move.power && <span>威力:{move.power}</span>}
                  {move.accuracy && <span>命中:{move.accuracy}</span>}
                  <span>PP:{move.pp}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
