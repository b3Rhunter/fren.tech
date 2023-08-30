import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/storage';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCbxRD88DiIhg9gxJ5PjSzJBxw2ygTU8vU",
  authDomain: "fren-tech-v2.firebaseapp.com",
  projectId: "fren-tech-v2",
  storageBucket: "fren-tech-v2.appspot.com",
  messagingSenderId: "459855358",
  appId: "1:459855358:web:0bf96b41ed79e38f929caf"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

export const storage = firebaseApp.storage();
export const db = firebaseApp.firestore();