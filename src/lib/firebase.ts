// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHqcZH7dklkzxduJfyoI6LG9i1a-CgtVg",
  authDomain: "mycondoapp-ff3ae.firebaseapp.com",
  projectId: "mycondoapp-ff3ae",
  storageBucket: "mycondoapp-ff3ae.firebasestorage.app",
  messagingSenderId: "976486909319",
  appId: "1:976486909319:web:fde483b4c439e452343f22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Default company ID (hardcoded for now)
export const DEFAULT_COMPANY_ID = "thandi";

export { app, db, auth, storage };
