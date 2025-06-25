import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA5ia1cFqxamm2exfqb1-pTvGzQFHGKlsQ",
  authDomain: "johnmunga-2d89b.firebaseapp.com",
  databaseURL: "https://johnmunga-2d89b-default-rtdb.firebaseio.com",
  projectId: "johnmunga-2d89b",
  storageBucket: "johnmunga-2d89b.firebasestorage.app",
  messagingSenderId: "1036647099803",
  appId: "1:1036647099803:web:87a204324b19099adc053e",
  measurementId: "G-97VVKSQ7ZW",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export const setAuthPersistence = () => setPersistence(auth, browserLocalPersistence);
