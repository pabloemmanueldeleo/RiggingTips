// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBduxYP7UL2ywULkzbDStGq5938dhKbsbA",
    authDomain: "riggingtips.firebaseapp.com",
    databaseURL: "https://riggingtips-default-rtdb.firebaseio.com",
    projectId: "riggingtips",
    storageBucket: "riggingtips.appspot.com",
    messagingSenderId: "821610458031",
    appId: "1:821610458031:web:17b94dcb8d9d10e89c9d5a"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar servicios
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configuración de Firestore
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('La persistencia falló, múltiples pestañas abiertas');
        } else if (err.code == 'unimplemented') {
            console.warn('El navegador no soporta persistencia');
        }
    });

// Exportar servicios con métodos getter para asegurar acceso
window.firebaseService = {
    auth,
    db,
    storage,
    firebase,
    initialized: true,
    getAuth: () => auth,
    getDb: () => db,
    getStorage: () => storage
}; 