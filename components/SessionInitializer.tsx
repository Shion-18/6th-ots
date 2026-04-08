'use client';

import { useEffect } from 'react';
import { ensureSession } from '@/lib/user-id';
import { migrateLocalStorageToKV } from '@/lib/team-storage';

export default function SessionInitializer() {
  useEffect(() => {
    async function init() {
      await ensureSession();
      await migrateLocalStorageToKV();
    }
    init();
  }, []);

  return null;
}
