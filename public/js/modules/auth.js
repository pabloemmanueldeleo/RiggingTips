// Módulo de autenticación
const authModule = {
    auth: null,
    db: null,
    
    init() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.setupAuthUI();
        this.setupAuthStateChanged();
        this.setupBypassAuth();
        
        // Mostrar mensaje de depuración para API KEY
        console.log("Intentando autenticación con Firebase. Versión:", firebase.SDK_VERSION);
    },

    setupAuthUI() {
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', () => this.signInWithGoogle());
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.signOut());
        }
    },
    
    setupBypassAuth() {
        // Acceso directo para desarrollo
        const bypassButton = document.getElementById('bypassAuthButton');
        if (bypassButton) {
            bypassButton.addEventListener('click', () => {
                console.log("Acceso directo activado");
                // Simular un usuario autenticado
                this.showStatus("Accediendo en modo desarrollo...");
                
                // Ocultar login y mostrar panel de administración
                const adminPanel = document.getElementById('adminPanel');
                const loginContainer = document.getElementById('loginContainer');
                
                if (adminPanel) adminPanel.classList.remove('hidden');
                if (loginContainer) loginContainer.classList.add('hidden');
                
                // Guardar estado en localStorage
                localStorage.setItem('devModeEnabled', 'true');
                
                setTimeout(() => {
                    this.showStatus("Modo desarrollo activado - SOLO PARA PRUEBAS");
                }, 1000);
            });
        }
        
        // Verificar si ya estaba en modo desarrollo
        if (localStorage.getItem('devModeEnabled') === 'true') {
            console.log("Modo desarrollo activo desde localStorage");
            const adminPanel = document.getElementById('adminPanel');
            const loginContainer = document.getElementById('loginContainer');
            
            if (adminPanel) adminPanel.classList.remove('hidden');
            if (loginContainer) loginContainer.classList.add('hidden');
        }
    },

    setupAuthStateChanged() {
        this.auth.onAuthStateChanged(async (user) => {
            // Si está en modo desarrollo, no hacer nada
            if (localStorage.getItem('devModeEnabled') === 'true') {
                console.log("Ignorando cambio de estado de autenticación (modo desarrollo)");
                return;
            }
            
            const adminPanel = document.getElementById('adminPanel');
            const loginContainer = document.getElementById('loginContainer');
            
            if (user) {
                console.log("Usuario autenticado:", user.email);
                try {
                    // Verificar si el usuario está autorizado
                    const isAuthorized = await this.checkUserAuthorization(user.email);
                    console.log("¿Usuario autorizado?:", isAuthorized);
                    
                    if (isAuthorized) {
                        if (adminPanel) adminPanel.classList.remove('hidden');
                        if (loginContainer) loginContainer.classList.add('hidden');
                    } else {
                        this.showError('No tienes autorización para acceder al panel de administración');
                        await this.signOut();
                    }
                } catch (error) {
                    console.error('Error al verificar autorización:', error);
                    this.showError('Error al verificar la autorización: ' + error.message);
                }
            } else {
                if (adminPanel) adminPanel.classList.add('hidden');
                if (loginContainer) loginContainer.classList.remove('hidden');
            }
        });
    },

    async checkUserAuthorization(email) {
        if (!email) return false;
        
        try {
            console.log("Verificando autorización para:", email);
            
            // Primero intentamos con RTDB (más rápido y confiable)
            const rtdb = firebase.database();
            const emailKey = email.replace(/\./g, '_');
            console.log("Clave en RTDB:", emailKey);
            
            const snapshot = await rtdb.ref('correosAutorizados').child(emailKey).get();
            console.log("Resultado de RTDB:", snapshot.exists() ? "Existe" : "No existe", snapshot.val());
            
            if (snapshot.exists() && snapshot.val() === true) {
                return true;
            }

            // Si no está en RTDB, intentamos con Firestore
            const userDoc = await this.db.collection('correosAutorizados').doc(email).get();
            console.log("Resultado de Firestore:", userDoc.exists ? "Existe" : "No existe");
            
            return userDoc.exists && userDoc.data().autorizado === true;
        } catch (error) {
            console.error('Error al verificar autorización:', error);
            return false;
        }
    },

    async signInWithGoogle() {
        try {
            this.showStatus("Iniciando sesión con Google...");
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Intenta primero con Popup
            try {
                console.log("Intentando inicio de sesión con popup");
                await this.auth.signInWithPopup(provider);
                return;
            } catch (popupError) {
                console.warn("Error con popup:", popupError);
                
                // Si falla el popup, intenta con redirección
                if (popupError.code === 'auth/popup-blocked' || 
                    popupError.code === 'auth/cancelled-popup-request' ||
                    popupError.code === 'auth/unauthorized-domain') {
                    
                    console.log("Intentando inicio de sesión con redirección");
                    this.showStatus("Redirigiendo a Google...");
                    await this.auth.signInWithRedirect(provider);
                    return;
                }
                
                // Si es otro error, lanzarlo para manejarlo abajo
                throw popupError;
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.showError('Error al iniciar sesión con Google: ' + this.getErrorMessage(error));
        }
    },

    async signOut() {
        try {
            // Limpiar modo desarrollo si está activo
            localStorage.removeItem('devModeEnabled');
            
            await this.auth.signOut();
            
            // Asegurarse que se muestre la pantalla de login
            const adminPanel = document.getElementById('adminPanel');
            const loginContainer = document.getElementById('loginContainer');
            
            if (adminPanel) adminPanel.classList.add('hidden');
            if (loginContainer) loginContainer.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.showError('Error al cerrar sesión');
        }
    },

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            errorContainer.className = 'error-message';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 10000);
        }
        console.error("Error mostrado:", message);
    },
    
    showStatus(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            errorContainer.className = 'status-message';
        }
        console.log("Estado:", message);
    },

    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/popup-blocked':
                return 'El popup fue bloqueado. Intenta deshabilitar el bloqueador de popups.';
            case 'auth/popup-closed-by-user':
                return 'El proceso de inicio de sesión fue cancelado.';
            case 'auth/unauthorized-domain':
                return 'Este dominio no está autorizado para operaciones de OAuth. Contacta al administrador.';
            case 'auth/cancelled-popup-request':
                return 'La operación fue cancelada por otra solicitud de autenticación.';
            case 'auth/network-request-failed':
                return 'Error de red. Verifica tu conexión a internet.';
            case 'auth/internal-error':
                return 'Error interno de autenticación. Intenta de nuevo más tarde.';
            default:
                return `${error.code}: ${error.message}`;
        }
    }
};

// Manejar redirecciones de autenticación
document.addEventListener('DOMContentLoaded', async () => {
    const auth = firebase.auth();
    
    try {
        // Verificar si hay resultado de una redirección
        const result = await auth.getRedirectResult();
        if (result.user) {
            console.log("Usuario autenticado mediante redirección:", result.user.email);
        }
    } catch (error) {
        console.error("Error al procesar redirección:", error);
        if (document.getElementById('errorContainer')) {
            document.getElementById('errorContainer').textContent = 
                `Error de redirección: ${error.code}`;
            document.getElementById('errorContainer').style.display = 'block';
        }
    }
    
    // Inicializar módulo
    authModule.init();
}); 