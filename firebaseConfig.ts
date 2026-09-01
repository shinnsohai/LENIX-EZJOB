import * as firebaseApp from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyCy37S2u8ej9kTkOK4Y88bk2Yhaig1Q61w",
  authDomain: "ezjob-d058b.firebaseapp.com",
  projectId: "ezjob-d058b",
  storageBucket: "ezjob-d058b.firebasestorage.app",
  messagingSenderId: "225160841948",
  appId: "1:225160841948:web:3ed53517d6520d50994219",
  measurementId: "G-9SXPDEGYSV"
};

let app;
let auth;
let db;
let storage;

try {
  // Using namespace import for firebase/app to avoid named export resolution issues in some environments
  app = firebaseApp.initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Re-throw to ensure the app doesn't try to run with broken firebase
  throw error;
}

export { auth, db, storage };
export default app;