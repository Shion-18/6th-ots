'use client';

import { useEffect } from 'react';
import { ensureSession } from '@/lib/user-id';

export default function SessionInitializer() {
  useEffect(() => {
    ensureSession();
  }, []);

  return null;
}
