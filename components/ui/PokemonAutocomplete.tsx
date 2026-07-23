'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import allPokemon from '@/data/all-pokemon.json';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import TypeIcon from './TypeIcon';

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

interface PokemonAutocompleteProps {
  onSelect: (pokemon: PokemonData) => void;
  placeholder?: string;
  selectedPokemon?: PokemonData | null;
}

export default function PokemonAutocomplete({
  onSelect,
  placeholder = 'ポケモンを検索...',
  selectedPokemon,
}: PokemonAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);
  const [filteredPokemon, setFilteredPokemon] = useState<PokemonData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // debounce後の検索語に応じてfilteredPokemonを更新する。
    // この effect はユーザー入力 → 検索結果の同期処理として意図的に setState を使う。
    if (!debouncedSearchTerm.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredPokemon([]);
       
      setIsOpen(false);
      return;
    }

    const filtered = (allPokemon as PokemonData[]).filter((p) => {
      // メガフォームは種族として直接選ばせない（ベース種族＋メガストーンで表現する）
      if (p.megaOf !== undefined) return false;
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        p.nameJa.includes(debouncedSearchTerm) ||
        p.nameEn.toLowerCase().includes(searchLower) ||
        p.name.toLowerCase().includes(searchLower) ||
        p.id.toString().includes(debouncedSearchTerm)
      );
    });

     
    setFilteredPokemon(filtered.slice(0, 10));
     
    setIsOpen(filtered.length > 0);
     
    setHighlightedIndex(0);
  }, [debouncedSearchTerm]);

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

  const handleSelect = (pokemon: PokemonData) => {
    onSelect(pokemon);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredPokemon.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPokemon[highlightedIndex]) {
          handleSelect(filteredPokemon[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
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
            if (filteredPokemon.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-field text-base"
        />
        {selectedPokemon && !searchTerm && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <Image
              src={selectedPokemon.sprite}
              alt={selectedPokemon.nameJa}
              width={32}
              height={32}
              className="pixelated"
            />
            <span className="font-medium text-on-surface-variant">
              {selectedPokemon.nameJa}
            </span>
          </div>
        )}
      </div>

      {isOpen && filteredPokemon.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-surface-container-high rounded-xl elevation-2 max-h-[400px] overflow-y-auto"
        >
          {filteredPokemon.map((pokemon, index) => (
            <button
              key={pokemon.id}
              onClick={() => handleSelect(pokemon)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-container-highest transition-colors border-b border-outline-variant last:border-b-0 ${
                index === highlightedIndex ? 'bg-surface-container-highest' : ''
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex-shrink-0 w-12 h-12 relative">
                <Image
                  src={pokemon.sprite}
                  alt={pokemon.nameJa}
                  width={48}
                  height={48}
                  className="pixelated object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-on-surface">
                    {pokemon.nameJa}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    No.{(pokemon.megaOf || pokemon.formOf || pokemon.id).toString().padStart(3, '0')}
                  </span>
                </div>
                <div className="flex gap-1 mt-1">
                  {pokemon.types.map((type) => (
                    <TypeIcon key={type} type={type} size="xs" />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
