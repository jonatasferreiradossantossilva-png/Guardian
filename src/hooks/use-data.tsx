'use client';

import React from 'react';
import { useMockData, useMockCollection, useMockDoc, useMockNestedDoc, isFirestoreMode, normalizeDataMode } from '@/hooks/use-mock-data';
import { MockDataProvider } from '@/hooks/use-mock-data';
import { FirestoreDataProvider } from '@/hooks/firestore-data-provider';
import type { MockDataContextType } from '@/hooks/use-mock-data';
import type { MockDB } from '@/types/mock-data';

export { isFirestoreMode, normalizeDataMode };

/**
 * DataProvider — The unified data provider that switches between
 * MockDataProvider (homologation) and FirestoreDataProvider (production)
 * based on the NEXT_PUBLIC_DATA_MODE environment variable.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  if (isFirestoreMode()) {
    return <FirestoreDataProvider>{children}</FirestoreDataProvider>;
  }
  return <MockDataProvider>{children}</MockDataProvider>;
}

/**
 * useData() — Returns the unified database context interface.
 */
export function useData(): MockDataContextType {
  return useMockData();
}

/**
 * useDataCollection() — Returns the collection state hook.
 */
export function useDataCollection<T = any>(collectionName: keyof MockDB, filters: any[] = []) {
  return useMockCollection<T>(collectionName, filters);
}

/**
 * useDataDoc() — Returns the single document state hook.
 */
export function useDataDoc<T = any>(collectionName: keyof MockDB, docId: string | null) {
  return useMockDoc<T>(collectionName, docId);
}

/**
 * useDataNestedDoc() — Returns the nested path document hook.
 */
export function useDataNestedDoc<T = any>(path: string | null) {
  return useMockNestedDoc<T>(path);
}
