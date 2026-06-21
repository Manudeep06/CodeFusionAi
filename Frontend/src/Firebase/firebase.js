// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCvPpvMLl0qfy826a2osPPh5dv1tjvUB4o",
  authDomain: "codefusionai-b7cf0.firebaseapp.com",
  projectId: "codefusionai-b7cf0",
  storageBucket: "codefusionai-b7cf0.firebasestorage.app",
  messagingSenderId: "497390272953",
  appId: "1:497390272953:web:9241acfa5d9406ec4cf668",
  measurementId: "G-D7Q3HQSSN9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);