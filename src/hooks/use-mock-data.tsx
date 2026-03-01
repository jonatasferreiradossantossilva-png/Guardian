
// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { initialMockData } from '@/lib/mock-data';

const MockDataContext = createContext(null);

let docIdCounter = 0; // Use a simple counter to ensure unique IDs within a session

// This provider will wrap the application and hold the state of the mock data.
export function MockDataProvider({ children }) {
  const [db, setDb] = useState(initialMockData);

  const getCollection = useCallback((collectionName, filters) => {
    if (!collectionName || !db[collectionName]) return [];

    let results;
    // The 'locations' key in db holds an object, not an array.
    // This handles calls that might incorrectly ask for the 'locations' collection,
    // preventing the .filter error.
    if (collectionName === 'locations') {
        results = Object.entries(db.locations).map(([id, data]) => ({ ...data, id }));
    } else {
        results = db[collectionName];
    }
    
    // Defensive check to ensure we only filter arrays.
    if (!Array.isArray(results)) {
        console.error(`Data for collection "${collectionName}" is not an array.`, results);
        return [];
    }

    if (filters && filters.length > 0) {
      results = results.filter(doc => {
        return filters.every(filter => {
          const { field, op, value } = filter;
          if (op === '==') {
            return doc[field] === value;
          }
          if (op === 'in') {
            // FIXED: Now correctly uses the field parameter instead of hardcoded doc.id
            return Array.isArray(value) && value.includes(doc[field]);
          }
          return true;
        });
      });
    }
    
    return results;
  }, [db]);

  const getDoc = useCallback((collectionName, docId) => {
    if (!collectionName || !docId) return null;
    const collection = db[collectionName];
    if (!Array.isArray(collection)) return null;
    return collection.find(doc => doc.id === docId) || null;
  }, [db]);
  
  const getNestedDoc = useCallback((path) => {
      const [collectionName, docId] = path.split('/');
      if (collectionName === 'locations' && docId) {
          return db.locations[docId] || null;
      }
      return null;
  }, [db]);

  const addDoc = useCallback((collectionName, data) => {
    // Using a counter appended to a timestamp ensures uniqueness even in fast loops.
    const newId = `${collectionName.slice(0, 3)}-${Date.now()}-${docIdCounter++}`;
    const newDoc = { ...data, id: newId };
    setDb(prevDb => ({
      ...prevDb,
      [collectionName]: [...(prevDb[collectionName] || []), newDoc],
    }));
  }, []);

  const updateDoc = useCallback((collectionName, docId, data) => {
    // Special handling for updating a location in the locations object
    if (collectionName === 'locations') {
        setDb(prevDb => {
            if (!prevDb.locations[docId]) return prevDb; // Don't update if it doesn't exist
            return {
                ...prevDb,
                locations: {
                    ...prevDb.locations,
                    [docId]: { ...(prevDb.locations[docId]), ...data }
                }
            };
        });
    } else {
        // Standard handling for array-based collections
        setDb(prevDb => ({
          ...prevDb,
          [collectionName]: (prevDb[collectionName] || []).map(doc =>
            doc.id === docId ? { ...doc, ...data } : doc
          ),
        }));
    }
  }, []);

  const setDoc = useCallback((path, data) => {
     const [collectionName, docId] = path.split('/');
      if (collectionName === 'locations' && docId) {
        setDb(prevDb => ({
            ...prevDb,
            locations: {
                ...prevDb.locations,
                [docId]: { ...(prevDb.locations[docId] || {}), ...data }
            }
        }));
      }
  }, []);

  const deleteDoc = useCallback((collectionName, docId) => {
    setDb(prevDb => ({
      ...prevDb,
      [collectionName]: (prevDb[collectionName] || []).filter(doc => doc.id !== docId),
    }));
  }, []);

  const value = useMemo(() => ({
    db,
    getCollection,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    getNestedDoc,
    setDoc,
  }), [db, getCollection, getDoc, addDoc, updateDoc, deleteDoc, getNestedDoc, setDoc]);

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

// Custom hook to access the mock database context.
export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
};

// A hook that simulates useCollection
export const useMockCollection = (collectionName, filters) => {
    const { getCollection, db } = useMockData();
    const data = useMemo(() => getCollection(collectionName, filters), [db, collectionName, JSON.stringify(filters), getCollection]);
    return { data, isLoading: false, error: null };
}

// A hook that simulates useDoc
export const useMockDoc = (collectionName, docId) => {
    const { getDoc, db } = useMockData();
    const data = useMemo(() => {
      if (collectionName && docId) {
        return getDoc(collectionName, docId);
      }
      return null;
    }, [db, collectionName, docId, getDoc]);

    return { data, isLoading: false, error: null };
}

// A hook that simulates useDoc for nested structures like locations
export const useMockNestedDoc = (path) => {
    const { getNestedDoc, db } = useMockData();
     const data = useMemo(() => path ? getNestedDoc(path) : null, [db, path, getNestedDoc]);
    return { data, isLoading: false, error: null };
}


// Mocks for non-blocking updates
export const addDocumentNonBlocking = (collectionRef, data) => {
    // This is a placeholder for API compatibility.
    // In mock mode, forms use `useMockData` directly.
};
export const updateDocumentNonBlocking = (docRef, data) => {
    // This is a placeholder for API compatibility.
};
export const deleteDocumentNonBlocking = (docRef) => {
    // This is a placeholder for API compatibility.
};
export const setDocumentNonBlocking = (docRef, data) => {
    // This is a placeholder for API compatibility.
};
