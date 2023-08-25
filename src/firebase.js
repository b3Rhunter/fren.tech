import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/storage';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAgaETX1KD2rbRfBcXQfnEBEZKIMDwr9Es",
  authDomain: "right-click-save-292b5.firebaseapp.com",
  projectId: "right-click-save-292b5",
  storageBucket: "right-click-save-292b5.appspot.com",
  messagingSenderId: "560276809544",
  appId: "1:560276809544:web:da7fbcb7edde164457f57d",
  measurementId: "G-BH8JENMQHG"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

export const storage = firebaseApp.storage();
export const db = firebaseApp.firestore();


