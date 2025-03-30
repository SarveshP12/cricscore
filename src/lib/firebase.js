import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getDatabase, 
  ref, 
  onValue, 
  update,
  query,
  orderByKey,
  limitToLast,
  push,
  runTransaction,
  connectDatabaseEmulator
} from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const firestoreDB = getFirestore(app);
export const db = getDatabase(app);

// Export `dbPaths` (Ensure it's included)
export const dbPaths = {
  matches: () => ref(db, 'matches'),
  matchById: (matchId) => ref(db, `matches/${matchId}`),
  ballHistory: (matchId) => ref(db, `matches/${matchId}/ballHistory`),
  scorecard: (matchId) => ref(db, `matches/${matchId}/scorecard`),
  currentPlayers: (matchId) => ref(db, `matches/${matchId}/currentPlayers`)
};
