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

/**
 * Firebase configuration object
 * @type {import("firebase/app").FirebaseOptions}
 */
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

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
const firestoreDB = getFirestore(app);
const db = getDatabase(app);

/**
 * Database path references for easy access
 * @namespace dbPaths
 */
const dbPaths = {
  // Match-related paths
  matches: () => ref(db, 'matches'),
  matchDetails: (matchId) => ref(db, `matches/${matchId}/matchDetails`),
  matchById: (matchId) => ref(db, `matches/${matchId}`),
  
  // Scoring paths
  ballHistory: (matchId) => ref(db, `matches/${matchId}/ballHistory`),
  scorecard: (matchId) => ref(db, `matches/${matchId}/scorecard`),
  currentPlayers: (matchId) => ref(db, `matches/${matchId}/currentPlayers`),
  
  // Utility paths
  liveMatches: () => query(ref(db, 'matches'), orderByKey(), limitToLast(20))
};

/**
 * Database utility functions
 * @namespace dbUtils
 */
const dbUtils = {
  /**
   * Get realtime updates from a database reference
   * @param {import("firebase/database").Reference} ref - Database reference
   * @param {(data: any) => void} callback - Callback with data
   * @returns {() => void} Unsubscribe function
   */
  subscribe: (ref, callback) => {
    const unsubscribe = onValue(ref, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return unsubscribe;
  },
  
  /**
   * Update match status
   * @param {string} matchId - Match ID
   * @param {"upcoming" | "live" | "completed"} status - New status
   * @returns {Promise<void>}
   */
  updateMatchStatus: (matchId, status) => {
    return update(dbPaths.matchDetails(matchId), { status });
  }
};

// Enable emulator in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectDatabaseEmulator(db, 'localhost', 9000);
    console.log('Firebase Realtime Database emulator connected');
  } catch (error) {
    console.warn('Failed to connect to database emulator:', error);
  }
}

export { 
  firestoreDB, 
  db,
  dbPaths,
  dbUtils,
  
  // Re-export commonly used database functions
  ref,
  onValue,
  update,
  query,
  push,
  runTransaction
};