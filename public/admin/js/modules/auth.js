// Módulo de autenticación
export const auth = {
    currentUser: null,
    
    async init() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseService && window.firebaseService.initialized) {
                    const auth = window.firebaseService.getAuth();
                    auth.onAuthStateChanged(user => {
                        this.currentUser = user;
                        resolve(user);
                    });
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    },

    async loginWithGoogle() {
        try {
            const auth = window.firebaseService.getAuth();
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Error de autenticación:', error);
            throw error;
        }
    },

    async logout() {
        try {
            const auth = window.firebaseService.getAuth();
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

    isAdmin(user) {
        return user && user.email === 'pabloemmanueldeleo@gmail.com';
    }
}; 