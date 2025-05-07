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
                    auth.onAuthStateChanged(user => {
                        this.currentUser = user;
                        console.log('Estado de autenticación cambiado:', user ? user.email : 'No autenticado');
                        resolve(user);
                    });
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    },

    // Iniciar sesión con Google
    async loginWithGoogle() {
        try {
            const auth = window.firebaseService.auth;
            const firebase = window.firebaseService.firebase;
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Error de autenticación:', error);
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
    isAdmin(user) {
        // Aquí se puede implementar la lógica para verificar si un usuario es administrador
        // Por ahora, cualquier usuario autenticado es administrador
        return !!user;
    }
}; 