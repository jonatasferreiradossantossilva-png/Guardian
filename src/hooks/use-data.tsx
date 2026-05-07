'use client';

import React from 'react';
import { MockDataProvider, useMockData, useMockCollection, useMockDoc, useMockNestedDoc } from '@/hooks/use-mock-data';
import { FirestoreDataProvider, useFirestoreData } from '@/hooks/firestore-data-provider';
import type { MockDataContextType } from '@/hooks/use-mock-data';
import type { MockDB } from '@/types/mock-data';

/**
 * Returns true if the app is running in Firestore (production) mode.
 * Controlled by the NEXT_PUBLIC_DATA_MODE environment variable.
 * Default: 'mock' (homologation).
 */
export function isFirestoreMode(): boolean {
  return process.env.NEXT_PUBLIC_DATA_MODE?.trim() === 'firestore';
}

/**
 * DataProvider — The unified data provider that switches between
 * MockDataProvider (homologation) and FirestoreDataProvider (production)
 * based on the NEXT_PUBLIC_DATA_MODE environment variable.
 *
 * Usage in layout.tsx:
 *   <DataProvider>{children}</DataProvider>
 *
 * Components continue using useData() / useDataCollection() / useDataDoc()
 * without knowing which backend they're talking to.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  if (isFirestoreMode()) {
    return <FirestoreDataProvider>{children}</FirestoreDataProvider>;
  }
  return <MockDataProvider>{children}</MockDataProvider>;
}

/**
 * useData() — Drop-in replacement for useMockData().
 * Returns the same MockDataContextType interface regardless of mode.
 */
export function useData(): MockDataContextType {
  if (isFirestoreMode()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useFirestoreData();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMockData();
}

/**
 * useDataCollection() — Drop-in replacement for useMockCollection().
 */
export function useDataCollection<T = any>(collectionName: keyof MockDB, filters: any[] = []) {
  if (isFirestoreMode()) {
    // In firestore mode, we use the same pattern via the unified context
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getCollection, db } = useFirestoreData();
    const rawCollection = db[collectionName];
    const filterKey = JSON.stringify(filters);
    const data = React.useMemo(() => {
      return getCollection(collectionName, filters) as T[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawCollection, collectionName, filterKey, getCollection]);
    return { data, isLoading: false, error: null };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMockCollection<T>(collectionName, filters);
}

/**
 * useDataDoc() — Drop-in replacement for useMockDoc().
 */
export function useDataDoc<T = any>(collectionName: keyof MockDB, docId: string | null) {
  if (isFirestoreMode()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getDoc, db } = useFirestoreData();
    const data = React.useMemo(() => {
      if (collectionName && docId) {
        return getDoc(collectionName, docId) as T | null;
      }
      return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, collectionName, docId, getDoc]);
    return { data, isLoading: false, error: null };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMockDoc<T>(collectionName, docId);
}

/**
 * useDataNestedDoc() — Drop-in replacement for useMockNestedDoc().
 */
export function useDataNestedDoc<T = any>(path: string | null) {
  if (isFirestoreMode()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getNestedDoc, db } = useFirestoreData();
    const data = React.useMemo(() => path ? getNestedDoc(path) as T | null : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, path, getNestedDoc]);
    return { data, isLoading: false, error: null };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMockNestedDoc<T>(path);
}
