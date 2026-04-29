'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

function createFirebaseApp() {
  if (getApps().length) return getApp();
  try {
    // Attempt automatic initialization (App Hosting)
    return initializeApp();
  } catch (e) {
    // Only use local config if auto-init fails
    if (process.env.NODE_ENV === "production") {
      console.warn("Automatic Firebase initialization failed. Using manual config fallback.");
    }
    return initializeApp(firebaseConfig);
  }
}

// Initialize Singleton Instances at Module Level
export const firebaseApp = createFirebaseApp();
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const database = getDatabase(firebaseApp);

// Enable persistence only on client Side
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(firestore)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn("Firestore offline persistence failed: " + err.message);
      } else if (err.code == 'unimplemented') {
        console.warn("Firestore offline persistence not supported in this browser.");
      }
    });
}

/**
 * Main initialization wrapper for compatibility with existing components
 */
export function initializeFirebase() {
  return { firebaseApp, auth, firestore, database };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
