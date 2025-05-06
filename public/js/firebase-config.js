// Configuración única de Firebase para toda la aplicación
const firebaseConfig = {
    // En producción, estas variables deberían venir de variables de entorno
    // Por ahora, mantenemos las claves aquí para desarrollo local
    apiKey: "AIzaSyBduxYP7UL2ywULkzbDStGq5938dhKbsbA",
    authDomain: "riggingtips.firebaseapp.com",
    databaseURL: "https://riggingtips-default-rtdb.firebaseio.com",
    projectId: "riggingtips",
    storageBucket: "riggingtips.appspot.com",
    messagingSenderId: "821610458031",
    appId: "1:821610458031:web:17b94dcb8d9d10e89c9d5a"
};

// Clase de servicio Firebase
class FirebaseService {
    constructor() {
        if (window.firebaseService) {
            return window.firebaseService;
        }

        // Inicializar Firebase
        try {
            this.app = firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.storage = firebase.storage();
            this.initialized = true;

            // Configurar persistencia
            this.setupPersistence();
            
            // Guardar instancia global
            window.firebaseService = this;
        } catch (error) {
            console.error('Error al inicializar Firebase:', error);
            this.handleError(error);
        }
    }

    async setupPersistence() {
        try {
            await this.db.enablePersistence({
                synchronizeTabs: true
            });
            console.log('Persistencia offline habilitada');
        } catch (err) {
            if (err.code === 'failed-precondition') {
                console.warn('La persistencia falló: múltiples pestañas abiertas');
            } else if (err.code === 'unimplemented') {
                console.warn('El navegador no soporta persistencia');
            }
        }

        try {
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } catch (error) {
            console.error('Error en persistencia de auth:', error);
        }
    }

    handleError(error) {
        console.error('Error en Firebase Service:', error);
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    Error al inicializar Firebase. Por favor, recarga la página o contacta al administrador.
                    ${process.env.NODE_ENV === 'development' ? `<br><small>${error.message}</small>` : ''}
                </div>
            `;
        }
    }

    // Getters para acceder a los servicios
    getApp() { return this.app; }
    getDb() { return this.db; }
    getAuth() { return this.auth; }
    getStorage() { return this.storage; }
}

// Crear instancia única
const firebaseService = new FirebaseService();

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    firebaseService.initialize();
}); 