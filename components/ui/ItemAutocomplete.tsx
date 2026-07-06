'use client';

import { useState, useEffect, useRef } from 'react';
import { CompetitiveItem, MegaStone } from '@/lib/item-helpers';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface ItemAutocompleteProps {
  competitiveItems: CompetitiveItem[];
  megaStones: MegaStone[];
  currentItem: string;
  onSelectItem: (itemName: string) => void;
  placeholder?: string;
}

export default function ItemAutocomplete({
  competitiveItems,
  megaStones,
  currentItem,
  onSelectItem,
  placeholder = '持ち物を検索...',
}: ItemAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 200);
  const [filteredItems, setFilteredItems] = useState<Array<{ name: string; category: string; isMegaStone: boolean }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // debounce後の検索語に応じてfilteredItemsを更新する（意図的なsetState）
    if (!debouncedSearchTerm.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredItems([]);
       
      setIsOpen(false);
      return;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();

    const filteredCompetitive = competitiveItems
      .filter((item) =>
        item.name.includes(debouncedSearchTerm) ||
        item.id.toLowerCase().includes(searchLower)
      )
      .map((item) => ({
        name: item.name,
        category: item.category,
        isMegaStone: false,
      }));

    const filteredMega = megaStones
      .filter((stone) =>
        stone.name.includes(debouncedSearchTerm) ||
        stone.id.toLowerCase().includes(searchLower) ||
        stone.basePokemonName.includes(debouncedSearchTerm)
      )
      .map((stone) => ({
        name: stone.name,
        category: 'mega-stone',
        isMegaStone: true,
      }));

    const combined = [...filteredCompetitive, ...filteredMega];
     
    setFilteredItems(combined.slice(0, 15));
     
    setIsOpen(combined.length > 0);
     
    setHighlightedIndex(0);
  }, [debouncedSearchTerm, competitiveItems, megaStones]);

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

  const handleSelect = (itemName: string) => {
    onSelectItem(itemName);
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
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[highlightedIndex]) {
          handleSelect(filteredItems[highlightedIndex].name);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      'offensive': '攻撃',
      'defensive': '防御',
      'type-boost': 'タイプ強化',
      'plate': 'プレート',
      'berry': 'きのみ',
      'species-specific': '専用',
      'utility': '補助',
      'weather': '天候',
      'status': '状態',
      'mega-stone': 'メガストーン',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'offensive': 'bg-red-500',
      'defensive': 'bg-blue-500',
      'type-boost': 'bg-purple-500',
      'plate': 'bg-yellow-500',
      'berry': 'bg-green-500',
      'species-specific': 'bg-pink-500',
      'utility': 'bg-gray-500',
      'weather': 'bg-cyan-500',
      'status': 'bg-orange-500',
      'mega-stone': 'bg-indigo-600',
    };
    return colors[category] || 'bg-gray-400';
  };

  const handleClear = () => {
    onSelectItem('');
    setSearchTerm('');
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (filteredItems.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={currentItem || placeholder}
            className="w-full px-4 py-2 border border-line rounded-lg focus:border-accent focus:outline-none transition-colors text-sm"
          />
        </div>
        {currentItem && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-card border border-line hover:bg-surface rounded-lg transition-colors text-sm font-medium text-ink-muted"
          >
            解除
          </button>
        )}
      </div>

      {isOpen && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-card border border-line rounded-lg shadow-md max-h-[400px] overflow-y-auto"
        >
          {filteredItems.map((item, index) => (
            <button
              key={`${item.name}-${index}`}
              onClick={() => handleSelect(item.name)}
              className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-surface transition-colors border-b border-line last:border-b-0 text-left ${
                index === highlightedIndex ? 'bg-surface' : ''
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-sm">
                    {item.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded text-white ${getCategoryColor(item.category)}`}>
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
