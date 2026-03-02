
// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { initialMockData } from '@/lib/mock-data';

const MockDataContext = createContext(null);

let docIdCounter = 0; 

export function MockDataProvider({ children }) {
  const [db, setDb] = useState(initialMockData);

  const getCollection = useCallback((collectionName, filters) => {
    if (!collectionName || !db[collectionName]) return [];

    let results;
    if (collectionName === 'locations') {
        results = Object.entries(db.locations).map(([id, data]) => ({ ...data, id }));
    } else {
        results = db[collectionName];
    }
    
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
    // Se o dado já trouxer um ID (como fizemos na aprovação), nós o respeitamos.
    // Caso contrário, geramos um novo.
    const newId = data.id || `${collectionName.slice(0, 3)}-${Date.now()}-${docIdCounter++}`;
    const newDoc = { ...data, id: newId };
    setDb(prevDb => ({
      ...prevDb,
      [collectionName]: [...(prevDb[collectionName] || []), newDoc],
    }));
    return newId;
  }, []);

  const updateDoc = useCallback((collectionName, docId, data) => {
    if (collectionName === 'locations') {
        setDb(prevDb => {
            if (!prevDb.locations[docId]) return prevDb; 
            return {
                ...prevDb,
                locations: {
                    ...prevDb.locations,
                    [docId]: { ...(prevDb.locations[docId]), ...data }
                }
            };
        });
    } else {
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

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
};

export const useMockCollection = (collectionName, filters) => {
    const { getCollection, db } = useMockData();
    const data = useMemo(() => getCollection(collectionName, filters), [db, collectionName, JSON.stringify(filters), getCollection]);
    return { data, isLoading: false, error: null };
}

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

export const useMockNestedDoc = (path) => {
    const { getNestedDoc, db } = useMockData();
     const data = useMemo(() => path ? getNestedDoc(path) : null, [db, path, getNestedDoc]);
    return { data, isLoading: false, error: null };
}
