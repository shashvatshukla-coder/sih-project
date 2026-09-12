import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance cleanly (prevent duplicate init in HMR or dev)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Authentication and Firestore Database instances
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Master Email having ultimate super-admin / inspection access
export const MASTER_ADMIN_EMAIL = 'shashvatshukla81@gmail.com';

export const isMasterAccount = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
};

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
