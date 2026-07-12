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
  onAuthStateChanged,
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

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
  return result;
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
