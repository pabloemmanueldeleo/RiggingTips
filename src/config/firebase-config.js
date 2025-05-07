// Importar Firebase
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBduxYP7UL2ywULkzbDStGq5938dhKbsbA",
    authDomain: "riggingtips.firebaseapp.com",
    databaseURL: "https://riggingtips-default-rtdb.firebaseio.com",
    projectId: "riggingtips",
    storageBucket: "riggingtips.firebasestorage.app",
    messagingSenderId: "821610458031",
    appId: "1:821610458031:web:17b94dcb8d9d10e89c9d5a"
  };

// Inicializar Firebase
let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

// Inicializar servicios
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

export { db, auth, storage }; 