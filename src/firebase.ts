// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDYvTAqtyFGhBnQ-3GavB1yEIMmqBz0Pk",
  authDomain: "bta-authentication.firebaseapp.com",
  projectId: "bta-authentication",
  storageBucket: "bta-authentication.firebasestorage.app",
  messagingSenderId: "179590547680",
  appId: "1:179590547680:web:d4b159c1e359875e4f2885",
  measurementId: "G-Y6SSMF18FP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);