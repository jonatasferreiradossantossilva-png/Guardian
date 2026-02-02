
// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { initialMockData } from '@/lib/mock-data';

const MockDataContext = createContext(null);

// This provider will wrap the application and hold the state of the mock data.
export function MockDataProvider({ children }) {
  const [db, setDb] = useState(initialMockData);

  const getCollection = useCallback((collectionName, filters) => {
    if (!collectionName) return [];
    let results = db[collectionName] || [];
    if (filters && filters.length > 0) {
      results = results.filter(doc => {
        return filters.every(filter => {
          const { field, op, value } = filter;
          if (op === '==') {
            // Handle nested objects for locations
            if (collectionName === 'locations') {
              return doc.id === value;
            }
            return doc[field] === value;
          }
          if (op === 'in') {
            return value.includes(doc.id);
          }
          return true;
        });
      });
    }
    // Specific handling for locations to return an array of the object
    if (collectionName === 'locations') {
        const locationData = db.locations;
        const filteredLocations = filters ? filters.reduce((acc, f) => {
            if (f.op === '==' && locationData[f.value]) {
                acc.push({ ...locationData[f.value], id: f.value });
            }
            return acc;
        }, []) : Object.entries(locationData).map(([id, data]) => ({...data, id}));
        return filteredLocations;
    }
    
    return results;
  }, [db]);

  const getDoc = useCallback((collectionName, docId) => {
    if (!collectionName || !docId) return null;
    return (db[collectionName] || []).find(doc => doc.id === docId) || null;
  }, [db]);
  
  const getNestedDoc = useCallback((path) => {
      const [collectionName, docId] = path.split('/');
      if (collectionName === 'locations' && docId) {
          return db.locations[docId] || null;
      }
      return null;
  }, [db]);

  const addDoc = useCallback((collectionName, data) => {
    // Add a random component to ensure unique IDs even in rapid succession.
    const newId = `${collectionName.slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newDoc = { ...data, id: newId };
    setDb(prevDb => ({
      ...prevDb,
      [collectionName]: [...(prevDb[collectionName] || []), newDoc],
    }));
  }, []);

  const updateDoc = useCallback((collectionName, docId, data) => {
    setDb(prevDb => ({
      ...prevDb,
      [collectionName]: (prevDb[collectionName] || []).map(doc =>
        doc.id === docId ? { ...doc, ...data } : doc
      ),
    }));
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
    // By depending on `db`, this hook will re-run when the database state changes,
    // which simulates the real-time nature of onSnapshot.
    // The filter object is stringified to prevent infinite loops from new array references.
    const data = useMemo(() => getCollection(collectionName, filters), [db, collectionName, JSON.stringify(filters), getCollection]);
    return { data, isLoading: false, error: null };
}

// A hook that simulates useDoc
export const useMockDoc = (collectionName, docId) => {
    const { getDoc, db, getNestedDoc } = useMockData();
    // By depending on `db`, this hook will re-run when the document data changes.
    const data = useMemo(() => {
      if (collectionName && docId) {
        return getDoc(collectionName, docId);
      }
      return null;
    }, [db, collectionName, docId, getDoc]);

    return { data, isLoading: false, error: null, getNestedDoc, db };
}

// A hook that simulates useDoc for nested structures like locations
export const useMockNestedDoc = (path) => {
    const { getNestedDoc, db } = useMockData();
     const data = useMemo(() => path ? getNestedDoc(path) : null, [db, path, getNestedDoc]);
    return { data, isLoading: false, error: null };
}


// Mocks for non-blocking updates
export const addDocumentNonBlocking = (collectionRef, data) => {
    // In mock, we can just call the addDoc from context
    // This is a placeholder, actual logic is in forms using useMockData
};
export const updateDocumentNonBlocking = (docRef, data) => {};
export const deleteDocumentNonBlocking = (docRef) => {};
export const setDocumentNonBlocking = (docRef, data) => {};

    