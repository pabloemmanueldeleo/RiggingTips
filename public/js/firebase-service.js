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

// Lista de administradores por defecto (puede ampliarse desde un archivo de configuración)
window.ADMIN_EMAILS = window.ADMIN_EMAILS || ['pabloemmanueldeleo@gmail.com'];

// Función para normalizar emails
window.normalizeEmail = function(email) {
    if (!email) return '';
    // Reemplaza todos los puntos y @ con guiones bajos
    return email.replace(/\./g, '_').replace('@', '_');
};

// Validar que todas las configuraciones estén presentes
if (!window._env_) {
    console.error('[FIREBASE_SERVICE] Las variables de entorno no están configuradas. Asegúrate de que el archivo env.js se haya cargado correctamente.');
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = '<div class="error-message">Error: Las variables de entorno no están configuradas. Contacta al administrador.</div>';
    }
}

Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) {
        console.error(`[FIREBASE_SERVICE] La configuración de Firebase está incompleta: falta ${key}`);
    }
});

// Variable para controlar si ya se inicializó Firebase
let firebaseInitialized = false;

// Función para obtener la URL actual
function getCurrentUrl() {
    return window.location.href;
}

// Función para determinar si estamos en la página de administración
function isAdminPage() {
    const url = getCurrentUrl();
    return url.includes('/admin/') || url.includes('/admin.html');
}

// Inicializar Firebase y exponer los servicios globalmente
try {
    // Evitar inicialización múltiple
    if (firebaseInitialized) {
        console.warn('[FIREBASE_SERVICE] Firebase ya fue inicializado. Evitando inicialización duplicada.');
    } else {
        console.log('[FIREBASE_SERVICE] Iniciando inicialización de Firebase...');
        
        // Inicializar Firebase
        const app = firebase.initializeApp(firebaseConfig);
        
        // Configurar el objeto de firebaseService básico antes de la persistencia
        window.firebaseService = {
            firebase: firebase,
            auth: firebase.auth(),
            db: firebase.firestore(),
            storage: firebase.storage(),
            rtdb: firebase.database(),
            initialized: false, // Será true cuando se complete todo el proceso
            persistenceError: false
        };
        
        // Configurar la persistencia de la autenticación ANTES de cualquier operación auth
        console.log('[FIREBASE_SERVICE] Configurando persistencia de autenticación...');
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
          .then(() => {
            console.log('[AUTH_PERSISTENCE] Persistencia de autenticación establecida en LOCAL.');
            // Ahora el servicio está completamente inicializado
            window.firebaseService.initialized = true;
            window.firebaseService.persistenceError = false;
            
            // Habilitar persistencia offline para Firestore
            window.firebaseService.db.enablePersistence({synchronizeTabs: true})
                .catch((err) => {
                    if (err.code == 'failed-precondition') {
                        console.warn('[FIREBASE_SERVICE] La persistencia de Firestore falló: múltiples pestañas abiertas');
                    } else if (err.code == 'unimplemented') {
                        console.warn('[FIREBASE_SERVICE] El navegador no soporta persistencia de Firestore');
                    }
                });
                
            console.log('[FIREBASE_SERVICE] Firebase inicializado correctamente (con persistencia de auth configurada).');
            
            // Disparar un evento personalizado para notificar que firebaseService está listo
            document.dispatchEvent(new CustomEvent('firebaseServiceReady'));
            
            // Si estamos en la página de administración, comprobar si hay correo autorizado
            if (isAdminPage()) {
                crearCorreosAutorizadosSiNoExisten();
            }
          })
          .catch((error) => {
            console.error('[AUTH_PERSISTENCE] Error al establecer la persistencia de autenticación:', error);
            // Proceder con la inicialización incluso si la persistencia falla
            window.firebaseService.initialized = true; // Marcar como inicializado a pesar del error
            window.firebaseService.persistenceError = true;
            
            console.warn('[FIREBASE_SERVICE] Firebase inicializado, pero con error en la configuración de persistencia de auth.');
            document.dispatchEvent(new CustomEvent('firebaseServiceReady')); // Notificar igualmente
            
            // Si estamos en la página de administración, comprobar si hay correo autorizado
            if (isAdminPage()) {
                crearCorreosAutorizadosSiNoExisten();
            }
          });
        
        firebaseInitialized = true;
    }
} catch (error) {
    console.error('[FIREBASE_SERVICE] Error al inicializar Firebase:', error);
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="error-message">Error al inicializar Firebase: ${error.message}</div>`;
    }
} 

// Función para crear los correos autorizados si no existen
async function crearCorreosAutorizadosSiNoExisten() {
    try {
        // Procesar cada correo en la lista de administradores
        for (const adminEmail of window.ADMIN_EMAILS) {
            await crearCorreoAutorizadoSiNoExiste(adminEmail);
        }
    } catch (error) {
        console.error('[FIREBASE_SERVICE] Error al procesar correos autorizados:', error);
    }
}

// Función para crear un correo autorizado si no existe
async function crearCorreoAutorizadoSiNoExiste(correoAdmin) {
    try {
        const db = window.firebaseService.db;
        const correoAdminNormalizado = window.normalizeEmail(correoAdmin);
        
        console.log('[FIREBASE_SERVICE] Verificando si existe correo autorizado:', correoAdmin);
        
        try {
            // Verificar en RTDB (base de datos realtime)
            const rtdb = window.firebaseService.rtdb;
            if (rtdb) {
                await rtdb.ref('correosAutorizados/' + correoAdminNormalizado).set(true);
                console.log('[FIREBASE_SERVICE] ✅ Correo autorizado guardado en RTDB con formato normalizado:', correoAdminNormalizado);
            }
            
            // Verificar en Firestore
            const docRef = await db.collection('correosAutorizados').doc(correoAdmin).get();
            
            if (!docRef.exists) {
                console.log('[FIREBASE_SERVICE] Correo autorizado no existe como ID, verificando como campo...');
                
                // Verificar si existe como field email
                const snapshot = await db.collection('correosAutorizados').where('email', '==', correoAdmin).get();
                
                if (snapshot.empty) {
                    console.log('[FIREBASE_SERVICE] Correo autorizado no existe, creándolo...');
                    
                    try {
                        // Crear el documento con el correo como ID
                        await db.collection('correosAutorizados').doc(correoAdmin).set({
                            email: correoAdmin,
                            normalizedEmail: correoAdminNormalizado,
                            roles: ['admin'],
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        console.log('[FIREBASE_SERVICE] ✅ Correo autorizado creado exitosamente en Firestore');
                    } catch (createError) {
                        console.error('[FIREBASE_SERVICE] Error al crear el correo autorizado en Firestore:', createError);
                        console.log('[FIREBASE_SERVICE] Intentando crear de forma alternativa...');
                        
                        // Intentar crear de forma alternativa (con add en lugar de set)
                        try {
                            await db.collection('correosAutorizados').add({
                                email: correoAdmin,
                                normalizedEmail: correoAdminNormalizado,
                                roles: ['admin'],
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            console.log('[FIREBASE_SERVICE] ✅ Correo autorizado creado exitosamente en Firestore (método alternativo)');
                        } catch (altCreateError) {
                            console.error('[FIREBASE_SERVICE] Error al crear con método alternativo:', altCreateError);
                        }
                    }
                } else {
                    console.log('[FIREBASE_SERVICE] ✅ Correo autorizado existe como campo email en Firestore');
                }
            } else {
                console.log('[FIREBASE_SERVICE] ✅ Correo autorizado existe como ID del documento en Firestore');
            }
        } catch (readError) {
            console.error('[FIREBASE_SERVICE] Error al verificar si existe el correo (posible problema de permisos):', readError);
            
            // Si hay error de permisos al leer, intentamos crear directamente
            console.log('[FIREBASE_SERVICE] Intentando crear correo sin verificar...');
            
            try {
                // OPCIÓN 1: Crear usando set con ID
                await db.collection('correosAutorizados').doc(correoAdmin).set({
                    email: correoAdmin,
                    normalizedEmail: correoAdminNormalizado,
                    roles: ['admin'],
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('[FIREBASE_SERVICE] ✅ Correo autorizado creado directamente con éxito en Firestore');
            } catch (directCreateError) {
                console.error('[FIREBASE_SERVICE] Error al crear directamente en Firestore:', directCreateError);
                
                try {
                    // OPCIÓN 2: Crear usando add (genera ID automático)
                    await db.collection('correosAutorizados').add({
                        email: correoAdmin,
                        normalizedEmail: correoAdminNormalizado,
                        roles: ['admin'],
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('[FIREBASE_SERVICE] ✅ Correo autorizado creado con add() con éxito en Firestore');
                } catch (addError) {
                    console.error('[FIREBASE_SERVICE] Error al crear usando add() en Firestore:', addError);
                }
            }
        }
    } catch (error) {
        console.error('[FIREBASE_SERVICE] ❌ Error general al verificar/crear correo autorizado:', error);
        
        // Informar al usuario del error pero no bloquear la aplicación
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Error al configurar permisos de administrador. Por favor, contacta al administrador.';
            errorContainer.appendChild(errorMessage);
            
            // Eliminar mensaje después de 5 segundos
            setTimeout(() => {
                if (errorMessage.parentNode) {
                    errorMessage.parentNode.removeChild(errorMessage);
                }
            }, 5000);
        }
    }
} 