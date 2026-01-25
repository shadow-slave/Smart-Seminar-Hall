// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// You get this from the Firebase Console -> Project Settings -> General -> "Your apps"
const firebaseConfig = {
  apiKey: "",
  authDomain: "smart-seminar-hall.firebaseapp.com",
  databaseURL:
    "",
  projectId: "smart-seminar-hall",
  storageBucket: "smart-seminar-hall.firebasestorage.app",
  messagingSenderId: "",
  appId: "1::web:d0614bc3d1bdea1595d170",
  measurementId: "G-",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it
export const database = getDatabase(app);



