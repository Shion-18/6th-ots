'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import allPokemon from '@/data/all-pokemon.json';

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
  const [filteredPokemon, setFilteredPokemon] = useState<PokemonData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPokemon([]);
      setIsOpen(false);
      return;
    }

    const filtered = (allPokemon as PokemonData[]).filter((p) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        p.nameJa.includes(searchTerm) ||
        p.nameEn.toLowerCase().includes(searchLower) ||
        p.name.toLowerCase().includes(searchLower) ||
        p.id.toString().includes(searchTerm)
      );
    });

    setFilteredPokemon(filtered.slice(0, 10)); // Show max 10 results
    setIsOpen(filtered.length > 0);
    setHighlightedIndex(0);
  }, [searchTerm]);

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
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-base"
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
            <span className="font-medium text-gray-700">
              {selectedPokemon.nameJa}
            </span>
          </div>
        )}
      </div>

      {isOpen && filteredPokemon.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-[400px] overflow-y-auto"
        >
          {filteredPokemon.map((pokemon, index) => (
            <button
              key={pokemon.id}
              onClick={() => handleSelect(pokemon)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === highlightedIndex ? 'bg-blue-100' : ''
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
                  <span className="font-bold text-gray-800">
                    {pokemon.nameJa}
                  </span>
                  <span className="text-xs text-gray-500">
                    No.{(pokemon.megaOf || pokemon.formOf || pokemon.id).toString().padStart(3, '0')}
                  </span>
                </div>
                <div className="flex gap-1 mt-1">
                  {pokemon.types.map((type) => (
                    <span
                      key={type}
                      className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700"
                    >
                      {type}
                    </span>
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
