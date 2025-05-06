// Configura aquí tu email autorizado
const ADMIN_EMAIL = 'pabloemmanueldeleo@gmail.com';

// Estado global
let currentUser = null;
let currentEditingId = null;
let loadedData = [];
let elements = {};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Cargado - Inicializando elementos...');
    
    // Inicializar elementos
    elements = {
        adminPanel: document.getElementById('adminPanel'),
        loginRequired: document.getElementById('loginRequired'),
        loginBtn: document.getElementById('loginBtn'),
        nodosContainer: document.getElementById('nodosList'),
        addForm: document.getElementById('formularioDatos'),
        searchInput: document.getElementById('searchInput'),
        loadingIndicator: document.getElementById('loadingIndicator')
    };

    // Verificar que todos los elementos existen
    Object.entries(elements).forEach(([key, element]) => {
        if (!element) {
            console.error(`Elemento no encontrado: ${key}`);
        }
    });

    // Configurar event listeners
    if (elements.addForm) {
        elements.addForm.addEventListener('submit', guardarNodo);
    }

    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            const busqueda = e.target.value.toLowerCase();
            const filtrados = loadedData.filter(nodo => 
                nodo.nombre?.toLowerCase().includes(busqueda) ||
                nodo.descripcion?.toLowerCase().includes(busqueda)
            );
            renderizarNodos(filtrados);
        });
    }

    // Iniciar observador de autenticación
    initAuthObserver();
});

// Función de login con Google
window.loginConGoogle = async function() {
    try {
        showLoading(true);
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
    } catch (error) {
        console.error('Error en login:', error);
        mostrarError('Error al iniciar sesión: ' + error.message);
    } finally {
        showLoading(false);
    }
};

// Inicializar observador de autenticación
function initAuthObserver() {
    console.log('Iniciando observador de autenticación...');
    
    firebase.auth().onAuthStateChanged((user) => {
        console.log('Estado de autenticación cambiado:', user ? user.email : 'No hay usuario');
        
        if (!elements.adminPanel || !elements.loginRequired) {
            console.error('Elementos críticos no encontrados');
            return;
        }

        if (user && user.email === ADMIN_EMAIL) {
            currentUser = user;
            elements.adminPanel.style.display = 'block';
            elements.loginRequired.style.display = 'none';
            cargarDatos();
        } else {
            currentUser = null;
            elements.adminPanel.style.display = 'none';
            elements.loginRequired.style.display = 'block';
            if (user) {
                firebase.auth().signOut().then(() => {
                    mostrarError('Esta cuenta no tiene permisos de administrador');
                });
            }
        }
    });
}

// Cargar datos de Firestore
async function cargarDatos() {
    if (!elements.nodosContainer) return;
    
    try {
        showLoading(true);
        const snapshot = await db.collection('nodos').get();
        loadedData = [];
        snapshot.forEach(doc => {
            loadedData.push({ id: doc.id, ...doc.data() });
        });
        renderizarNodos(loadedData);
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar los datos. Por favor, recarga la página.');
    } finally {
        showLoading(false);
    }
}

// Renderizar nodos
function renderizarNodos(nodos) {
    if (!elements.nodosContainer) return;
    
    if (nodos.length === 0) {
        elements.nodosContainer.innerHTML = '<p>No hay nodos creados aún.</p>';
        return;
    }

    const html = nodos.map(nodo => `
        <div class="nodo-card" data-id="${nodo.id}">
            <h3>${nodo.nombre || 'Sin título'}</h3>
            <p>${nodo.descripcion || 'Sin descripción'}</p>
            ${nodo.imagenUrl ? `<img src="${nodo.imagenUrl}" alt="Imagen del nodo">` : ''}
            <div class="nodo-actions">
                <button onclick="editarNodo('${nodo.id}')" class="btn-edit">
                    Editar
                </button>
                <button onclick="confirmarEliminacion('${nodo.id}')" class="btn-delete">
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');

    elements.nodosContainer.innerHTML = html;
}

// Manejo de archivos
async function subirArchivo(file, nodoId) {
    if (!file) return null;
    
    try {
        const extension = file.name.split('.').pop();
        const nombreArchivo = `nodos/${nodoId}/${Date.now()}.${extension}`;
        const storageRef = storage.ref(nombreArchivo);
        
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw new Error('Error al subir el archivo');
    }
}

// Guardar nodo
async function guardarNodo(event) {
    event.preventDefault();
    
    try {
        showLoading(true);
        const formData = new FormData(elements.addForm);
        const datos = Object.fromEntries(formData.entries());
        
        // Si hay archivo, subirlo primero
        const archivo = formData.get('archivo');
        let urlArchivo = null;
        
        if (currentEditingId) {
            // Actualizar existente
            if (archivo.size > 0) {
                urlArchivo = await subirArchivo(archivo, currentEditingId);
                datos.archivoUrl = urlArchivo;
            }
            await db.collection('nodos').doc(currentEditingId).update(datos);
        } else {
            // Crear nuevo
            const docRef = await db.collection('nodos').add(datos);
            if (archivo.size > 0) {
                urlArchivo = await subirArchivo(archivo, docRef.id);
                await docRef.update({ archivoUrl: urlArchivo });
            }
        }
        
        elements.addForm.reset();
        currentEditingId = null;
        await cargarDatos();
        mostrarMensaje('Nodo guardado exitosamente');
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarError('Error al guardar el nodo');
    } finally {
        showLoading(false);
    }
}

// Editar nodo
async function editarNodo(id) {
    try {
        showLoading(true);
        const doc = await db.collection('nodos').doc(id).get();
        if (!doc.exists) {
            mostrarError('El nodo no existe');
            return;
        }

        const data = doc.data();
        currentEditingId = id;
        
        // Rellenar formulario
        Object.entries(data).forEach(([key, value]) => {
            const input = elements.addForm.elements[key];
            if (input) input.value = value;
        });
        
        // Scroll al formulario
        elements.addForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error al cargar nodo:', error);
        mostrarError('Error al cargar el nodo para editar');
    } finally {
        showLoading(false);
    }
}

// Eliminar nodo
async function eliminarNodo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este nodo?')) return;
    
    try {
        showLoading(true);
        // Eliminar archivos asociados
        const nodo = loadedData.find(n => n.id === id);
        if (nodo && nodo.archivoUrl) {
            const storageRef = storage.refFromURL(nodo.archivoUrl);
            await storageRef.delete();
        }
        
        await db.collection('nodos').doc(id).delete();
        await cargarDatos();
        mostrarMensaje('Nodo eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarError('Error al eliminar el nodo');
    } finally {
        showLoading(false);
    }
}

// Utilidades UI
function showLoading(show) {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

function mostrarMensaje(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function mostrarError(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Cerrar sesión
window.logout = function() {
    firebase.auth().signOut().catch(error => {
        console.error('Error al cerrar sesión:', error);
        mostrarError('Error al cerrar sesión');
    });
}; 