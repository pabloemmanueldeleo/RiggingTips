// Módulo de autenticación
export const auth = {
    currentUser: null,
    
    // Inicializar el módulo de autenticación
    async init() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseService && window.firebaseService.initialized) {
                    const auth = window.firebaseService.auth;
                    
                    // Escuchar cambios en el estado de autenticación
                    auth.onAuthStateChanged(async user => {
                        this.currentUser = user;
                        console.log('Estado de autenticación cambiado:', user ? user.email : 'No autenticado');
                        
                        if (user) {
                            // Verificar si el usuario está autorizado
                            const isAuthorized = await this.checkUserAuthorization(user);
                            if (!isAuthorized) {
                                console.log('Usuario no autorizado, cerrando sesión');
                                this.showError('No tienes autorización para acceder al panel de administración');
                                await this.logout();
                                resolve(null);
                                return;
                            }
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
            const { db } = window.firebaseService;
            const userEmail = user.email;
            
            // Verificar en Firestore
            const authorizedDoc = await db.collection('correosAutorizados').doc(userEmail).get();
            if (authorizedDoc.exists) {
                console.log('Usuario autorizado en Firestore');
                return true;
            }
            
            console.log('Usuario no encontrado en la lista de correos autorizados');
            return false;
        } catch (error) {
            console.error('Error al verificar autorización:', error);
            return false;
        }
    },

    // Iniciar sesión con Google
    async loginWithGoogle() {
        try {
            const auth = window.firebaseService.auth;
            const firebase = window.firebaseService.firebase;
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            
            // Verificar si el usuario está autorizado
            const isAuthorized = await this.checkUserAuthorization(result.user);
            if (!isAuthorized) {
                this.showError('No tienes autorización para acceder al panel de administración');
                await this.logout();
                return null;
            }
            
            return result.user;
        } catch (error) {
            console.error('Error de autenticación:', error);
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
            console.error('Error al cerrar sesión:', error);
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