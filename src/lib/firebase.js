// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // optional if you don't use Storage

// Your project's web app config (from Firebase Console → Project settings → Your apps → Config)
const firebaseConfig = {
  apiKey: "AIzaSyBwExDFAII8sHHwdv9izRIyXtd_JIrXzF8",
  authDomain: "scholarknowledge-6609a.firebaseapp.com",
  projectId: "scholarknowledge-6609a",

  // IMPORTANT: use the bucket name form *.appspot.com for the SDK config
  storageBucket: "scholarknowledge-6609a.appspot.com",

  messagingSenderId: "321204825237",
  appId: "1:321204825237:web:4af9c62537dc9792dabf9c",
  // measurementId is optional; include only if you use Analytics:
  // measurementId: "G-8DYK0P1L5B",
};

// Avoid re-initializing in hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // remove/export only if needed