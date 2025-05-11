// Configuración de Firebase
const firebaseConfig = {
    apiKey: window._env_?.FIREBASE_API_KEY,
    authDomain: window._env_?.FIREBASE_AUTH_DOMAIN,
    projectId: window._env_?.FIREBASE_PROJECT_ID,
    storageBucket: window._env_?.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window._env_?.FIREBASE_MESSAGING_SENDER_ID,
    appId: window._env_?.FIREBASE_APP_ID
};

// Validar que todas las configuraciones estén presentes
if (!window._env_) {
    throw new Error('Las variables de entorno no están configuradas. Asegúrate de que el archivo env.js se haya generado correctamente.');
}

Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) {
        throw new Error(`La configuración de Firebase está incompleta: falta ${key}`);
    }
});

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Habilitar persistencia offline para Firestore
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('La persistencia falló: múltiples pestañas abiertas');
        } else if (err.code == 'unimplemented') {
            console.warn('El navegador no soporta persistencia');
        }
    });

// Exportar la configuración y servicios
export { auth, db, storage, firebaseConfig }; 