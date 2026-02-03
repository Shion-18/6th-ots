import { PokemonType } from '@/types/pokemon';

// タイプごとの色定義
export function getTypeColor(type: PokemonType): string {
  const colors: Record<PokemonType, string> = {
    'ノーマル': '#A8A878',
    'ほのお': '#F08030',
    'みず': '#6890F0',
    'でんき': '#F8D030',
    'くさ': '#78C850',
    'こおり': '#98D8D8',
    'かくとう': '#C03028',
    'どく': '#A040A0',
    'じめん': '#E0C068',
    'ひこう': '#A890F0',
    'エスパー': '#F85888',
    'むし': '#A8B820',
    'いわ': '#B8A038',
    'ゴースト': '#705898',
    'ドラゴン': '#7038F8',
    'あく': '#705848',
    'はがね': '#B8B8D0',
    'フェアリー': '#EE99AC'
  };
  return colors[type] || '#777777';
}

// タイプごとの背景色クラス（Tailwind）
export function getTypeBgColor(type: PokemonType): string {
  const colors: Record<PokemonType, string> = {
    'ノーマル': 'bg-gray-400',
    'ほのお': 'bg-orange-500',
    'みず': 'bg-blue-500',
    'でんき': 'bg-yellow-400',
    'くさ': 'bg-green-500',
    'こおり': 'bg-cyan-300',
    'かくとう': 'bg-red-700',
    'どく': 'bg-purple-600',
    'じめん': 'bg-yellow-600',
    'ひこう': 'bg-indigo-400',
    'エスパー': 'bg-pink-500',
    'むし': 'bg-lime-500',
    'いわ': 'bg-yellow-700',
    'ゴースト': 'bg-purple-700',
    'ドラゴン': 'bg-indigo-600',
    'あく': 'bg-gray-700',
    'はがね': 'bg-gray-400',
    'フェアリー': 'bg-pink-400'
  };
  return colors[type] || 'bg-gray-500';
}

// タイプごとのテキスト色クラス（Tailwind）
export function getTypeTextColor(type: PokemonType): string {
  const colors: Record<PokemonType, string> = {
    'ノーマル': 'text-gray-400',
    'ほのお': 'text-orange-500',
    'みず': 'text-blue-500',
    'でんき': 'text-yellow-400',
    'くさ': 'text-green-500',
    'こおり': 'text-cyan-300',
    'かくとう': 'text-red-700',
    'どく': 'text-purple-600',
    'じめん': 'text-yellow-600',
    'ひこう': 'text-indigo-400',
    'エスパー': 'text-pink-500',
    'むし': 'text-lime-500',
    'いわ': 'text-yellow-700',
    'ゴースト': 'text-purple-700',
    'ドラゴン': 'text-indigo-600',
    'あく': 'text-gray-700',
    'はがね': 'text-gray-400',
    'フェアリー': 'text-pink-400'
  };
  return colors[type] || 'text-gray-500';
}
