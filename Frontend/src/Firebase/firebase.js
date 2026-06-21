import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvPpvMLl0qfy826a2osPPh5dv1tjvUB4o",
  authDomain: "codefusionai-b7cf0.firebaseapp.com",
  projectId: "codefusionai-b7cf0",
  storageBucket: "codefusionai-b7cf0.firebasestorage.app",
  messagingSenderId: "497390272953",
  appId: "1:497390272953:web:9241acfa5d9406ec4cf668",
  measurementId: "G-D7Q3HQSSN9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () =>
  signInWithPopup(auth, provider);

export const logout = () =>
  signOut(auth);

export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);