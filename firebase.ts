/**
 * @module firebase
 *
 * Initializes the Firebase SDK and re-exports commonly used Firebase
 * Authentication and Firestore utilities. All Firebase interactions in the
 * app import from this single entry point to keep configuration centralized.
 *
 * Depends on `VITE_FIREBASE_*` environment variables defined in `.env.local`.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, updateDoc, deleteDoc, where, getDocs, writeBatch } from 'firebase/firestore';

/**
 * Firebase project configuration sourced from Vite environment variables.
 * These values are injected at build time and are safe to expose client-side.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/** Initialized Firebase application instance. */
const app = initializeApp(firebaseConfig);

/** Firebase Authentication instance for the app. */
const auth = getAuth(app);

/** Cloud Firestore database instance for the app. */
const db = getFirestore(app);

export {
  auth,
  db,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  writeBatch,
  updateProfile
};