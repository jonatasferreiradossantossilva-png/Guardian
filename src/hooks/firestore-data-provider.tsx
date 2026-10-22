'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc as firestoreGetDoc,
  addDoc as firestoreAddDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  setDoc as firestoreSetDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore, auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { MockDB } from '@/types/mock-data';
import { MockDataContext, type MockDataContextType } from '@/hooks/use-mock-data';

/**
 * FirestoreDataProvider — Drop-in replacement for MockDataProvider.
 * Implements the exact same MockDataContextType interface but reads/writes
 * from real Firestore instead of localStorage.
 *
 * Key differences from mock:
 * - `db` is populated via realtime listeners (onSnapshot)
 * - CRUD operations write to Firestore, then listeners update `db`
 * - Simulation features (forceScenario, isSimulating) are no-ops in production
 */

const WATCHED_COLLECTIONS: (keyof MockDB)[] = [
  'users', 'schools', 'parents', 'students', 'drivers', 'monitors',
  'vehicles', 'routes', 'route_manifests', 'invoices', 'expenses', 'trip_requests',
  'pending_registrations', 'messages', 'announcements', 'incidents',
  'contract_templates', 'contracts', 'authorized_pickups', 'predefined_messages',
  'notifications', 'company_profile',
];

// Collections that map to different Firestore collection names (if needed)
const COLLECTION_NAME_MAP: Partial<Record<keyof MockDB, string>> = {
  // Add mappings here if Firestore collection names differ from MockDB keys
  // e.g., trip_history: 'trip_history',
};

function getFirestoreCollectionName(key: keyof MockDB): string {
  return COLLECTION_NAME_MAP[key] || key;
}

const generateId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().split('-')[0]}-${Date.now().toString(36)}`;
  }
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;
};

// Empty DB structure matching MockDB
const createEmptyDb = (): MockDB => ({
  config: [],
  telemetry: [],
  company_profile: [],
  users: [],
  schools: [],
  school_knowledge_base: [],
  parents: [],
  students: [],
  drivers: [],
  monitors: [],
  vehicles: [],
  routes: [],
  route_manifests: [],
  locations: {},
  invoices: [],
  expenses: [],
  trip_history: [],
  trip_requests: [],
  pending_registrations: [],
  messages: [],
  announcements: [],
  incidents: [],
  contract_templates: [],
  contracts: [],
  authorized_pickups: [],
  predefined_messages: [],
  notifications: [],
});

const FirestoreDataContext = createContext<MockDataContextType | null>(null);

export function FirestoreDataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<MockDB>(createEmptyDb);
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribesRef = useRef<Unsubscribe[]>([]);

  // Setup realtime listeners ONLY after user is authenticated
  // This prevents 20+ PERMISSION_DENIED errors on initial page load
  useEffect(() => {
    if (!firestore || !auth) return;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Tear down any previous listeners
      unsubscribesRef.current.forEach((u) => u());
      unsubscribesRef.current = [];

      if (!user) {
        // User signed out — reset to empty and stop loading
        setDb(createEmptyDb());
        setIsLoading(false);
        return;
      }

      // User is authenticated — setup realtime listeners
      const unsubs: Unsubscribe[] = [];

      WATCHED_COLLECTIONS.forEach((collectionKey) => {
        const collName = getFirestoreCollectionName(collectionKey);
        const colRef = collection(firestore, collName);

        const unsub = onSnapshot(
          colRef,
          (snapshot) => {
            const docs = snapshot.docs.map((d) => ({
              ...d.data(),
              id: d.id,
            }));

            setDb((prev) => ({
              ...prev,
              [collectionKey]: docs,
            }));
          },
          (error) => {
            // Silently handle permission errors for collections user can't list
            if (error.code !== 'permission-denied') {
              console.error(`[Guardian Firestore] Error listening to ${collName}:`, error.message);
            }
          }
        );

        unsubs.push(unsub);
      });

      // Listen to locations (special: it's a Record, not an array)
      const locationsUnsub = onSnapshot(
        collection(firestore, 'locations'),
        (snapshot) => {
          const locations: Record<string, any> = {};
          snapshot.docs.forEach((d) => {
            locations[d.id] = { ...d.data(), id: d.id };
          });
          setDb((prev) => ({
            ...prev,
            locations,
          }));
        },
        (error) => {
          if (error.code !== 'permission-denied') {
            console.error('[Guardian Firestore] Error listening to locations:', error.message);
          }
        }
      );
      unsubs.push(locationsUnsub);

      unsubscribesRef.current = unsubs;
      setIsLoading(false);
    });

    return () => {
      unsubAuth();
      unsubscribesRef.current.forEach((u) => u());
    };
  }, []);

  // --- CRUD Functions matching MockDataContextType ---

  const getCollection = useCallback(
    (collectionName: keyof MockDB, filters?: any[]): any[] => {
      if (!collectionName || !db[collectionName]) return [];

      let results: any[];
      if (collectionName === 'locations') {
        results = Object.entries(db.locations).map(([id, data]) => ({ ...data, id }));
      } else {
        results = db[collectionName] as any[];
      }

      if (!Array.isArray(results)) return [];

      if (filters && Array.isArray(filters) && filters.length > 0) {
        results = results.filter((doc) =>
          filters.every((filter) => {
            const { field, op, value } = filter;
            if (value === null || value === undefined || value === '') return false;
            if (op === '==') return doc[field] === value;
            if (op === 'in') return Array.isArray(value) && value.includes(doc[field]);
            return true;
          })
        );
      }

      return results;
    },
    [db]
  );

  const getDoc = useCallback(
    (collectionName: keyof MockDB, docId: string): any => {
      if (!collectionName || !docId) return null;
      const coll = db[collectionName];
      if (!Array.isArray(coll)) return null;
      return coll.find((d: any) => d.id === docId) || null;
    },
    [db]
  );

  const getNestedDoc = useCallback(
    (path: string): any => {
      const [collectionName, docId] = path.split('/');
      if (collectionName === 'locations' && docId) {
        return db.locations[docId] || null;
      }
      return null;
    },
    [db]
  );

  const addDoc = useCallback(
    (collectionName: keyof MockDB, data: any): string => {
      const collName = getFirestoreCollectionName(collectionName);
      const newId = data.id || generateId(collectionName.slice(0, 3));
      const docData = { ...data };
      delete docData.id; // Firestore uses doc ID separately

      // Atualização otimista imediata para reatividade instantânea na UI
      setDb((prevDb) => {
        const collection = prevDb[collectionName];
        if (Array.isArray(collection)) {
          return {
            ...prevDb,
            [collectionName]: [...collection, { ...data, id: newId }],
          };
        }
        return prevDb;
      });

      // Write to Firestore (async, but we return ID immediately for compat)
      const docRef = doc(firestore, collName, newId);
      firestoreSetDoc(docRef, docData).catch((err) => {
        console.error(`[Guardian Firestore] addDoc error (${collName}):`, err);
      });

      return newId;
    },
    []
  );

  const addDocsBatch = useCallback(
    (collectionName: keyof MockDB, dataArray: any[]): void => {
      if (!dataArray.length) return;
      const collName = getFirestoreCollectionName(collectionName);
      const batch = writeBatch(firestore);

      dataArray.forEach((data) => {
        const newId = data.id || generateId(collectionName.slice(0, 3));
        const docData = { ...data };
        delete docData.id;
        const docRef = doc(firestore, collName, newId);
        batch.set(docRef, docData);
      });

      batch.commit().catch((err) => {
        console.error(`[Guardian Firestore] addDocsBatch error (${collName}):`, err);
      });
    },
    []
  );

  const updateDocFn = useCallback(
    (collectionName: keyof MockDB, docId: string, data: any): void => {
      // Atualização otimista imediata para reatividade instantânea na UI
      setDb((prevDb) => {
        const collection = prevDb[collectionName];
        if (Array.isArray(collection)) {
          return {
            ...prevDb,
            [collectionName]: collection.map((doc: any) =>
              doc.id === docId ? { ...doc, ...data } : doc
            ),
          };
        }
        return prevDb;
      });

      const collName = getFirestoreCollectionName(collectionName);

      if (collectionName === 'locations') {
        const docRef = doc(firestore, 'locations', docId);
        firestoreSetDoc(docRef, data, { merge: true }).catch((err) => {
          console.error(`[Guardian Firestore] updateDoc error (locations/${docId}):`, err);
        });
      } else {
        const docRef = doc(firestore, collName, docId);
        firestoreUpdateDoc(docRef, data).catch((err) => {
          console.error(`[Guardian Firestore] updateDoc error (${collName}/${docId}):`, err);
        });
      }
    },
    []
  );

  const deleteDocFn = useCallback(
    (collectionName: keyof MockDB, docId: string): void => {
      // Atualização otimista imediata para reatividade instantânea na UI
      setDb((prevDb) => {
        const collection = prevDb[collectionName];
        if (Array.isArray(collection)) {
          return {
            ...prevDb,
            [collectionName]: collection.filter((doc: any) => doc.id !== docId),
          };
        }
        return prevDb;
      });

      const collName = getFirestoreCollectionName(collectionName);
      const docRef = doc(firestore, collName, docId);
      firestoreDeleteDoc(docRef).catch((err) => {
        console.error(`[Guardian Firestore] deleteDoc error (${collName}/${docId}):`, err);
      });
    },
    []
  );

  const clearCollection = useCallback(
    (collectionName: keyof MockDB): void => {
      const collName = getFirestoreCollectionName(collectionName);
      // Clear all docs in collection via batch
      const colRef = collection(firestore, collName);
      getDocs(colRef).then((snapshot) => {
        const batch = writeBatch(firestore);
        snapshot.docs.forEach((d) => batch.delete(d.ref));
        return batch.commit();
      }).catch((err) => {
        console.error(`[Guardian Firestore] clearCollection error (${collName}):`, err);
      });
    },
    []
  );

  const setDocFn = useCallback(
    (path: string, data: any): void => {
      const [collectionName, docId] = path.split('/');
      if (collectionName && docId) {
        const docRef = doc(firestore, collectionName, docId);
        firestoreSetDoc(docRef, data, { merge: true }).catch((err) => {
          console.error(`[Guardian Firestore] setDoc error (${path}):`, err);
        });
      }
    },
    []
  );

  const createNotification = useCallback(
    (userId: string, title: string, message: string, type: 'info' | 'warning' | 'emergency' | 'success' = 'info') => {
      const notifData = {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const notifRef = doc(firestore, 'notifications', generateId('notif'));
      firestoreSetDoc(notifRef, notifData).catch((err) => {
        console.error('[Guardian Firestore] createNotification error:', err);
      });
    },
    []
  );

  // Production no-ops for simulation features
  const noopSetSimulating = useCallback((() => {}) as React.Dispatch<React.SetStateAction<boolean>>, []);
  const noopResetData = useCallback(() => {
    console.warn('[Guardian] resetData is not available in production mode.');
  }, []);
  const noopForceScenario = useCallback((_: 'motorista_inicio' | 'monitor_em_rota') => {
    console.warn('[Guardian] forceScenario is not available in production mode.');
  }, []);
  const noopClearAllAndReset = useCallback(() => {
    console.warn('[Guardian] clearAllAndReset is not available in production mode.');
  }, []);

  const value = useMemo(
    (): MockDataContextType => ({
      db,
      getCollection,
      getDoc,
      addDoc,
      addDocsBatch,
      updateDoc: updateDocFn,
      clearCollection,
      deleteDoc: deleteDocFn,
      getNestedDoc,
      setDoc: setDocFn,
      setIsSimulating: noopSetSimulating,
      isSimulating: false,
      resetData: noopResetData,
      forceScenario: noopForceScenario,
      clearAllAndReset: noopClearAllAndReset,
      createNotification,
    }),
    [db, getCollection, getDoc, addDoc, addDocsBatch, updateDocFn, clearCollection, deleteDocFn, getNestedDoc, setDocFn, createNotification, noopSetSimulating, noopResetData, noopForceScenario, noopClearAllAndReset]
  );

  return (
    <FirestoreDataContext.Provider value={value}>
      <MockDataContext.Provider value={value}>
        {children}
      </MockDataContext.Provider>
    </FirestoreDataContext.Provider>
  );
}

/**
 * Hook to access Firestore data with MockDataContextType interface.
 * This is the production equivalent of useMockData().
 */
export const useFirestoreData = () => {
  const context = useContext(FirestoreDataContext);
  if (!context) {
    throw new Error('useFirestoreData must be used within a FirestoreDataProvider');
  }
  return context;
};
