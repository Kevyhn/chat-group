// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnS-dO6AY2Ekze1enP9I9bpAgjyaRJ-k4",
  authDomain: "chat-group-de0a8.firebaseapp.com",
  projectId: "chat-group-de0a8",
  storageBucket: "chat-group-de0a8.appspot.com",
  messagingSenderId: "366938338932",
  appId: "1:366938338932:web:27720428a8ad62858a4321"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);