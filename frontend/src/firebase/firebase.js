// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChGAj1n_1ABQxLh1lGJ3HJCZ3k4rA3A-Y",
  authDomain: "nwhacks2025-9ef49.firebaseapp.com",
  projectId: "nwhacks2025-9ef49",
  storageBucket: "nwhacks2025-9ef49.firebasestorage.app",
  messagingSenderId: "853000831923",
  appId: "1:853000831923:web:5f29397aaa11d12a0ac1c6",
  measurementId: "G-DVTGC2KEB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };