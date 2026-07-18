'use client';

import { useState, useEffect, useRef } from 'react';
import { getTypeBgColor } from '@/lib/type-colors';
import { PokemonType } from '@/types/pokemon';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

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
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 200);
  const [filteredMoves, setFilteredMoves] = useState<MoveDetail[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // debounce後の検索語に応じてfilteredMovesを更新する（意図的なsetState）
    if (!debouncedSearchTerm.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredMoves([]);
       
      setIsOpen(false);
      return;
    }

    const filtered = availableMoves.filter((move) => {
      if (selectedMoves.includes(move.nameJa)) {
        return false;
      }

      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        move.nameJa.includes(debouncedSearchTerm) ||
        move.name.toLowerCase().includes(searchLower) ||
        move.type.includes(debouncedSearchTerm)
      );
    });

     
    setFilteredMoves(filtered.slice(0, 10));
     
    setIsOpen(filtered.length > 0);
     
    setHighlightedIndex(0);
  }, [debouncedSearchTerm, availableMoves, selectedMoves]);

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
          className="text-field text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {isOpen && filteredMoves.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-surface-container-high rounded-xl elevation-2 max-h-[300px] overflow-y-auto"
        >
          {filteredMoves.map((move, index) => (
            <button
              key={move.id}
              onClick={() => handleSelect(move)}
              className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-surface-container-highest transition-colors border-b border-outline-variant last:border-b-0 text-left ${
                index === highlightedIndex ? 'bg-surface-container-highest' : ''
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="text-lg">{getCategoryIcon(move.category)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-on-surface text-sm">
                    {move.nameJa}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded text-white ${getTypeBgColor(move.type as PokemonType)}`}>
                    {move.type}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {move.category}
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-on-surface-variant mt-0.5">
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
