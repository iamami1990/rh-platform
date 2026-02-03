// Firebase Configuration for Web Admin
// Olympia HR Platform

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDaf5r2Y06D7pQFNtxR8Rm59DlwuKGr8h0",
    authDomain: "tp22-64555.firebaseapp.com",
    projectId: "tp22-64555",
    storageBucket: "tp22-64555.firebasestorage.app",
    messagingSenderId: "782306146452",
    appId: "1:782306146452:web:139a3ff171f215e7a49c81",
    measurementId: "G-BW71SE5Z68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
