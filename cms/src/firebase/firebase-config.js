// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging"; // Add this import

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWPK6YOK65w1mSVh969SN-3Jkprd2VPTU",
  authDomain: "counseling-management-system.firebaseapp.com",
  projectId: "counseling-management-system",
  storageBucket: "counseling-management-system.appspot.com",
  messagingSenderId: "662850750993",
  appId: "1:662850750993:web:38ec747e0f2d68e99ebfb0",
  measurementId: "G-X127R0S4KM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const messaging = getMessaging(app); // Initialize Firebase Cloud Messaging

export { app, db, auth, messaging };