'use client';

import { getTypeColor } from '@/lib/type-colors';

interface TypeIconProps {
  type: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5 min-w-[40px]',
  sm: 'text-xs px-2 py-0.5 min-w-[48px]',
  md: 'text-sm px-2.5 py-1 min-w-[56px]',
  lg: 'text-base px-3 py-1 min-w-[64px]',
};

export default function TypeIcon({ type, size = 'sm', className = '' }: TypeIconProps) {
  const bgColor = getTypeColor(type as any);

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded font-bold text-white text-center
        ${sizeClasses[size]}
        ${className}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {type}
    </span>
  );
}
