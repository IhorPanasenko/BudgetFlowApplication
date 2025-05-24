// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_AEamxe0yMiEP0nBHPQPRVf2E0_KYvOg",
  authDomain: "budgetflow-87be3.firebaseapp.com",
  projectId: "budgetflow-87be3",
  storageBucket: "budgetflow-87be3.firebasestorage.app",
  messagingSenderId: "32698133614",
  appId: "1:32698133614:web:cb0e65b1e2cdf62cd70a7f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const firestore = getFirestore(app)
