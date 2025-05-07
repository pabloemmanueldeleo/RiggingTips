// Inicialización y exposición global de servicios Firebase

// Configuración de Firebase
const firebaseConfig = {
    apiKey: window._env_ && window._env_.FIREBASE_API_KEY,
    authDomain: window._env_ && window._env_.FIREBASE_AUTH_DOMAIN,
    projectId: window._env_ && window._env_.FIREBASE_PROJECT_ID,
    storageBucket: window._env_ && window._env_.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window._env_ && window._env_.FIREBASE_MESSAGING_SENDER_ID,
    appId: window._env_ && window._env_.FIREBASE_APP_ID,
    databaseURL: window._env_ && window._env_.FIREBASE_DATABASE_URL
};

// Validar que todas las configuraciones estén presentes
if (!window._env_) {
    console.error('Las variables de entorno no están configuradas. Asegúrate de que el archivo env.js se haya cargado correctamente.');
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = '<div class="error-message">Error: Las variables de entorno no están configuradas. Contacta al administrador.</div>';
    }
}

Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) {
        console.error(`La configuración de Firebase está incompleta: falta ${key}`);
    }
});

// Inicializar Firebase y exponer los servicios globalmente
try {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Exportar servicios de Firebase globalmente
    window.firebaseService = {
        firebase: firebase,
        auth: firebase.auth(),
        db: firebase.firestore(),
        storage: firebase.storage(),
        rtdb: firebase.database(),
        initialized: true
    };

    // Habilitar persistencia offline para Firestore
    window.firebaseService.db.enablePersistence()
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('La persistencia falló: múltiples pestañas abiertas');
            } else if (err.code == 'unimplemented') {
                console.warn('El navegador no soporta persistencia');
            }
        });
        
    console.log('Firebase inicializado correctamente');
} catch (error) {
    console.error('Error al inicializar Firebase:', error);
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="error-message">Error al inicializar Firebase: ${error.message}</div>`;
    }
} 