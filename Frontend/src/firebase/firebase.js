import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const provider = auth ? new GoogleAuthProvider() : null;

if (provider) {
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope("email");
  provider.addScope("profile");
}

const firebaseUnavailable = () => {
  throw new Error("Firebase is not configured for this local copy. Add the VITE_FIREBASE_* values in .env.local, then restart the frontend.");
};

// Google Sign In — uses popup (works on localhost & all domains reliably)
export const signInWithGoogle = async () => {
  if (!auth || !provider) firebaseUnavailable();
  const result = await signInWithPopup(auth, provider);
  return result;
};

// Google Sign In Redirect fallback
export const signInWithGoogleRedirect = async () => {
  if (!auth || !provider) firebaseUnavailable();
  return await signInWithRedirect(auth, provider);
};

// No-op kept for backwards compat — popup flow doesn't need a redirect handler
export const handleGoogleRedirect = async () => {
  if (!auth) firebaseUnavailable();
  return await getRedirectResult(auth);
};

// Logout
export const logout = async () => {
  if (!auth) return;
  return await signOut(auth);
};

// Register
export const registerUser = async (email, password) => {
  if (!auth) firebaseUnavailable();
  return await createUserWithEmailAndPassword(auth, email, password);
};

// Login
export const loginUser = async (email, password) => {
  if (!auth) firebaseUnavailable();
  return await signInWithEmailAndPassword(auth, email, password);
};

export const onAuthStateChanged = (authInstance, callback) => {
  if (!authInstance || !auth) {
    queueMicrotask(() => callback(null));
    return () => {};
  }
  return firebaseOnAuthStateChanged(authInstance, callback);
};
