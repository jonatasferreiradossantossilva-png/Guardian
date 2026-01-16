// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { initialMockData } from '@/lib/mock-data';

const MockDataContext = createContext(null);

// This provider will wrap the application and hold the state of the mock data.
export function MockDataProvider({ children }) {
  const [db, setDb] = useState(initialMockData);

  const getCollection = (collectionName, filters) => {
    let results = db[collectionName] || [];
    if (filters) {
      results = results.filter(doc => {
        return filters.every(filter => {
          const { field, op, value } = filter;
          if (op === '==') {
            return doc[field] === value;
          }
          if (op === 'in') {
            return value.includes(doc.id);
          }
          return true;
        });
      });
    }
    return results;
  };

  const getDoc = (collectionName, docId) => {
    return (db[collectionName] || []).find(doc => doc.id === docId) || null;
  }
  
  const getNestedDoc = (path) => {
      const [collectionName, docId] = path.split('/');
      if (collectionName === 'locations' && docId) {
          return db.locations[docId] || null;
      }
      return null;
  }

  const addDoc = (collectionName, data) => {
    const newDoc = { ...data, id: `${collectionName}-${Date.now()}` };
    setDb(prevDb => ({
      ...prevDb,
      [collectionName]: [...prevDb[collectionName], newDoc],
    }));
  };

  const updateDoc = (collectionName, docId, data) => {
    setDb(prevDb => ({
      ...prevDb,
      [collectionName]: prevDb[collectionName].map(doc =>
        doc.id === docId ? { ...doc, ...data } : doc
      ),
    }));
  };

  const setDoc = (path, data) => {
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
  };

  const deleteDoc = (collectionName, docId) => {
    setDb(prevDb => ({
      ...prevDb,
      [collectionName]: prevDb[collectionName].filter(doc => doc.id !== docId),
    }));
  };

  const value = useMemo(() => ({
    db,
    getCollection,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    getNestedDoc,
    setDoc,
  }), [db]);

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
    const { getCollection } = useMockData();
    const data = getCollection(collectionName, filters);
    return { data, isLoading: false, error: null };
}

// A hook that simulates useDoc
export const useMockDoc = (collectionName, docId) => {
    const { getDoc } = useMockData();
    const data = docId ? getDoc(collectionName, docId) : null;
    return { data, isLoading: false, error: null };
}

// A hook that simulates useDoc for nested structures like locations
export const useMockNestedDoc = (path) => {
    const { getNestedDoc } = useMockData();
    const data = path ? getNestedDoc(path) : null;
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
