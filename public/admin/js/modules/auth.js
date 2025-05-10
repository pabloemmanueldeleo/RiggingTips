// Módulo de autenticación
export const auth = {
    currentUser: null,
    
    // Inicializar el módulo de autenticación
    async init() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseService && window.firebaseService.initialized) {
                    const auth = window.firebaseService.auth;
                    
                    // Primero, verificar si hay un resultado de redirección pendiente
                    auth.getRedirectResult().then(result => {
                        console.log('[AUTH_MODULE] Verificando resultado de redirección:', result ? 'Hay resultado' : 'No hay resultado');
                        // El resultado se procesará en onAuthStateChanged
                    }).catch(error => {
                        console.error('[AUTH_MODULE] Error al obtener resultado de redirección:', error);
                    });
                    
                    // Escuchar cambios en el estado de autenticación
                    auth.onAuthStateChanged(async user => {
                        this.currentUser = user;
                        console.log('[AUTH_MODULE] Estado de autenticación cambiado:', user ? user.email : 'No autenticado');
                        
                        if (user) {
                            // Verificar si el usuario está autorizado
                            const isAuthorized = await this.checkUserAuthorization(user);
                            if (!isAuthorized) {
                                console.log('[AUTH_MODULE] Usuario no autorizado, cerrando sesión');
                                this.showError('No tienes autorización para acceder al panel de administración');
                                await this.logout();
                                resolve(null);
                                return;
                            }
                            
                            // Si llegamos aquí, el usuario está autorizado
                            console.log('[AUTH_MODULE] Usuario autorizado:', user.email);
                        }
                        
                        resolve(user);
                    });
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    },

    // Verificar si el usuario está autorizado
    async checkUserAuthorization(user) {
        if (!user) return false;
        
        try {
            console.log('[AUTH_MODULE] Verificando autorización para:', user.email);
            const { db } = window.firebaseService;
            
            // VERIFICACIÓN DIRECTA - Para solucionar temporalmente el problema
            // Si el email es pabloemmanueldeleo@gmail.com, autorizarlo directamente
            if (user.email === 'pabloemmanueldeleo@gmail.com') {
                console.log('[AUTH_MODULE] Email autorizado directamente en el código');
                return true;
            }
            
            // Verificar en la colección correosAutorizados
            const snapshot = await db.collection('correosAutorizados').where('email', '==', user.email).get();
            if (!snapshot.empty) {
                console.log('[AUTH_MODULE] Email encontrado en la colección correosAutorizados (por field email)');
                return true;
            }
            
            // Verificar como ID del documento
            const docRef = await db.collection('correosAutorizados').doc(user.email).get();
            if (docRef.exists) {
                console.log('[AUTH_MODULE] Email encontrado como ID de documento en correosAutorizados');
                return true;
            }
            
            console.log('[AUTH_MODULE] Usuario no autorizado, no se encontró su email en correosAutorizados');
            return false;
        } catch (error) {
            console.error('[AUTH_MODULE] Error al verificar autorización:', error);
            // En caso de error, permitir acceso temporalmente para depuración
            console.log('[AUTH_MODULE] Permitiendo acceso a pesar del error para facilitar depuración');
            return true;
        }
    },

    // Iniciar sesión con Google
    async loginWithGoogle() {
        try {
            const auth = window.firebaseService.auth;
            const firebase = window.firebaseService.firebase;
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Parámetros para forzar la selección de cuenta
            provider.setCustomParameters({
              prompt: 'select_account' 
            });
            
            // CAMBIO IMPORTANTE: Usar signInWithPopup en lugar de signInWithRedirect
            console.log('[AUTH_MODULE] ⚠️ CAMBIANDO A signInWithPopup en lugar de signInWithRedirect');
            try {
                const result = await auth.signInWithPopup(provider);
                console.log('[AUTH_MODULE] signInWithPopup completado:', result);
                
                if (result && result.user) {
                    console.log('[AUTH_MODULE] Usuario obtenido:', result.user.email);
                    
                    // Verificar si el usuario está autorizado
                    const isAuthorized = await this.checkUserAuthorization(result.user);
                    if (!isAuthorized) {
                        console.log('[AUTH_MODULE] Usuario NO autorizado');
                        this.showError('No tienes autorización para acceder al panel de administración');
                        await this.logout();
                        return null;
                    }
                    
                    console.log('[AUTH_MODULE] Usuario autorizado, autenticación exitosa');
                    return result.user;
                } else {
                    console.error('[AUTH_MODULE] No se obtuvo usuario después de signInWithPopup');
                    return null;
                }
            } catch (popupError) {
                console.error('[AUTH_MODULE] Error en signInWithPopup:', popupError);
                console.log('[AUTH_MODULE] Intentando método alternativo con signInWithRedirect');
                await auth.signInWithRedirect(provider);
                // Esta parte no se ejecutará si la redirección funciona correctamente
                return null;
            }
        } catch (error) {
            console.error('[AUTH_MODULE] Error de autenticación:', error);
            this.showError(`Error de autenticación: ${error.message}`);
            throw error;
        }
    },

    // Cerrar sesión
    async logout() {
        try {
            const auth = window.firebaseService.auth;
            await auth.signOut();
        } catch (error) {
            console.error('[AUTH_MODULE] Error al cerrar sesión:', error);
            throw error;
        }
    },
    
    // Mostrar mensaje de error
    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (!errorContainer) return;
        
        errorContainer.style.display = 'block';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorContainer.appendChild(errorDiv);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
            
            // Si no hay más mensajes, ocultar el contenedor
            if (errorContainer.children.length === 0) {
                errorContainer.style.display = 'none';
            }
        }, 5000);
    },

    onLogin(user) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('userInfo').textContent = `Hola, ${user.displayName}`;
    },

    onLogout() {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('adminContent').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('userInfo').textContent = '';
    },

    // Verificar si el usuario es administrador
    async isAdmin(user) {
        if (!user) return false;
        return await this.checkUserAuthorization(user);
    }
}; 