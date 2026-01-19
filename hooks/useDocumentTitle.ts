// FILE PATH: hooks/useDocumentTitle.ts
// Hook to dynamically set document title from store settings

'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useDocumentTitle() {
  const [storeName, setStoreName] = useState<string>('Inventory Management');

  useEffect(() => {
    loadStoreName();
  }, []);

  async function loadStoreName() {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('store_name')
        .limit(1)
        .single();

      if (data?.store_name) {
        setStoreName(data.store_name);
        document.title = data.store_name;
      }
    } catch (err) {
      console.error('Error loading store name for title:', err);
    }
  }

  return storeName;
}
