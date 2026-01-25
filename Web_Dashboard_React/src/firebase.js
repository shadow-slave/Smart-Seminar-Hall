// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// You get this from the Firebase Console -> Project Settings -> General -> "Your apps"
const firebaseConfig = {
  apiKey: "AIzaSyBdWuGBuNgefc29eMSdQ-vh4kx5p6l4yy0",
  authDomain: "smart-seminar-hall.firebaseapp.com",
  databaseURL:
    "https://smart-seminar-hall-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-seminar-hall",
  storageBucket: "smart-seminar-hall.firebasestorage.app",
  messagingSenderId: "470565346129",
  appId: "1:470565346129:web:d0614bc3d1bdea1595d170",
  measurementId: "G-57YNWP3P9M",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it
export const database = getDatabase(app);



