import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvPpvMLl0qfy826a2osPPh5dv1tjvUB4o",
  authDomain: "codefusionai-b7cf0.firebaseapp.com",
  projectId: "codefusionai-b7cf0",
  storageBucket: "codefusionai-b7cf0.firebasestorage.app",
  messagingSenderId: "497390272953",
  appId: "1:497390272953:web:9241acfa5d9406ec4cf668",
  measurementId: "G-D7Q3HQSSN9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication without loading the hidden cross-origin iframe (which is blocked by COEP)
export const auth = initializeAuth(app, {
  persistence: [
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
  ],
  popupRedirectResolver: browserPopupRedirectResolver,
});

// Google Provider
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});
provider.addScope("email");
provider.addScope("profile");

// Google Sign In — uses popup (works on localhost & all domains reliably)
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  return result; // Returns UserCredential immediately on success
};

// Google Sign In Redirect fallback
export const signInWithGoogleRedirect = async () => {
  return await signInWithRedirect(auth, provider);
};

// No-op kept for backwards compat — popup flow doesn't need a redirect handler
export const handleGoogleRedirect = async () => {
  return await getRedirectResult(auth);
};

// Logout
export const logout = async () => {
  return await signOut(auth);
};

// Register
export const registerUser = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

// Login
export const loginUser = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export { onAuthStateChanged };
