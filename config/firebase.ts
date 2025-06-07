import { initializeApp } from "firebase/app"
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"

import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import { Platform } from "react-native"

// Конфіг з environment
const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} = Constants.expoConfig?.extra || {}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)

let auth

if (Platform.OS === "web") {
  auth = getAuth(app) //  браузер не підтримує AsyncStorage
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  })
}

const firestore = getFirestore(app)

export { auth, firestore }
