
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase - Reemplazar con variables de entorno en producción
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey_1234567890",
  authDomain: "uniattend-mock.firebaseapp.com",
  projectId: "uniattend-mock",
  storageBucket: "uniattend-mock.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
