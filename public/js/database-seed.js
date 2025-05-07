// Script para limpiar y repoblar la base de datos con ejemplos
document.addEventListener('DOMContentLoaded', () => {
    // Escuchar evento de reset desde el panel de admin
    document.addEventListener('reset-database', () => {
        console.log('Evento de reinicio de base de datos recibido');
        showMessage('Iniciando la repoblación de la base de datos...');
        initDatabase();
    });
});

// Función para mostrar mensaje
function showMessage(message, isError = false) {
    const container = document.getElementById('errorContainer');
    if (!container) return;
    
    container.style.display = 'block';
    const messageDiv = document.createElement('div');
    messageDiv.className = isError ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    container.appendChild(messageDiv);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
        
        // Si no hay más mensajes, ocultar el contenedor
        if (container.children.length === 0) {
            container.style.display = 'none';
        }
    }, 5000);
}

// Función para inicializar la base de datos
async function initDatabase() {
    try {
        if (!window.firebaseService || !window.firebaseService.initialized) {
            showMessage('Firebase no está inicializado', true);
            return;
        }
        
        const { db, auth } = window.firebaseService;
        
        // Verificar que el usuario esté autenticado
        if (!auth.currentUser) {
            showMessage('Debes iniciar sesión para reiniciar la base de datos', true);
            return;
        }
        
        showMessage('Limpiando base de datos existente...');
        
        // 1. Inicializar la colección de correos autorizados
        await initCorreosAutorizados();
        
        // 2. Limpiar colecciones existentes
        await limpiarColecciones();
        
        // 3. Crear categorías de ejemplo
        await crearCategorias();
        
        // 4. Crear nodos (tips) de ejemplo
        await crearNodos();
        
        showMessage('¡Base de datos inicializada correctamente!');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        showMessage(`Error al inicializar la base de datos: ${error.message}`, true);
    }
}

// Función para inicializar correos autorizados
async function initCorreosAutorizados() {
    try {
        const { db, auth } = window.firebaseService;
        
        // Agregar el correo del usuario actual a la lista de autorizados
        if (auth.currentUser && auth.currentUser.email) {
            await db.collection('correosAutorizados').doc(auth.currentUser.email).set({
                autorizado: true,
                fechaAutorizacion: new Date(),
                nivel: 'admin'
            });
            
            console.log(`Correo autorizado agregado: ${auth.currentUser.email}`);
            showMessage(`Correo autorizado agregado: ${auth.currentUser.email}`);
        }
        
        // Agregar correos adicionales si se necesita
        const correosAdicionales = [
            'pabloemmanueldeleo@gmail.com'
        ];
        
        for (const email of correosAdicionales) {
            // Evitar duplicar el correo actual
            if (email !== auth.currentUser.email) {
                await db.collection('correosAutorizados').doc(email).set({
                    autorizado: true,
                    fechaAutorizacion: new Date(),
                    nivel: 'admin'
                });
                console.log(`Correo autorizado adicional: ${email}`);
            }
        }
        
        console.log('Correos autorizados inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar correos autorizados:', error);
        throw error;
    }
}

// Función para limpiar colecciones existentes
async function limpiarColecciones() {
    try {
        const { db } = window.firebaseService;
        
        // Obtener y eliminar todos los documentos de la colección nodos
        const nodosSnapshot = await db.collection('nodos').get();
        const nodosPromises = nodosSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(nodosPromises);
        console.log(`${nodosSnapshot.size} nodos eliminados`);
        
        // Obtener y eliminar todos los documentos de la colección categorias
        const categoriasSnapshot = await db.collection('categorias').get();
        const categoriasPromises = categoriasSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(categoriasPromises);
        console.log(`${categoriasSnapshot.size} categorías eliminadas`);
        
    } catch (error) {
        console.error('Error al limpiar colecciones:', error);
        throw error;
    }
}

// Función para crear categorías de ejemplo
async function crearCategorias() {
    try {
        const { db } = window.firebaseService;
        
        const categorias = [
            { id: 'modelado', nombre: 'Modelado', color: '#4caf50' },
            { id: 'rig', nombre: 'Rigging', color: '#2196f3' },
            { id: 'animacion', nombre: 'Animación', color: '#f44336' },
            { id: 'renderizado', nombre: 'Renderizado', color: '#ff9800' },
            { id: 'efectos', nombre: 'Efectos', color: '#9c27b0' }
        ];
        
        for (const categoria of categorias) {
            await db.collection('categorias').doc(categoria.id).set({
                nombre: categoria.nombre,
                color: categoria.color
            });
        }
        
        console.log(`${categorias.length} categorías creadas`);
    } catch (error) {
        console.error('Error al crear categorías:', error);
        throw error;
    }
}

// Función para crear nodos de ejemplo
async function crearNodos() {
    try {
        const { db } = window.firebaseService;
        
        const nodos = [
            {
                titulo: 'Control facial avanzado',
                descripcion: 'Técnicas para crear controles faciales avanzados en personajes 3D',
                categoria: 'rig',
                contenido: 'Para crear controles faciales avanzados, es importante entender la anatomía facial y cómo los músculos interactúan...',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/riggingtips.appspot.com/o/images%2Ffacial_rig.jpg?alt=media',
                publico: true,
                fechaCreacion: new Date()
            },
            {
                titulo: 'Optimización de mallas',
                descripcion: 'Cómo optimizar mallas para mejorar el rendimiento en tiempo real',
                categoria: 'modelado',
                contenido: 'La optimización de mallas es crucial para aplicaciones en tiempo real...',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/riggingtips.appspot.com/o/images%2Fmesh_optimization.jpg?alt=media',
                publico: true,
                fechaCreacion: new Date()
            },
            {
                titulo: 'Principios de animación',
                descripcion: 'Los 12 principios básicos de la animación aplicados a personajes 3D',
                categoria: 'animacion',
                contenido: 'Los 12 principios de animación establecidos por Disney siguen siendo relevantes en la animación 3D...',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/riggingtips.appspot.com/o/images%2Fanimation_principles.jpg?alt=media',
                publico: true,
                fechaCreacion: new Date()
            },
            {
                titulo: 'Materiales PBR',
                descripcion: 'Cómo configurar materiales PBR para obtener resultados realistas',
                categoria: 'renderizado',
                contenido: 'Los materiales basados en física (PBR) son esenciales para lograr imágenes realistas...',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/riggingtips.appspot.com/o/images%2Fpbr_materials.jpg?alt=media',
                publico: true,
                fechaCreacion: new Date()
            },
            {
                titulo: 'Simulación de líquidos',
                descripcion: 'Introducción a la simulación de fluidos para efectos visuales',
                categoria: 'efectos',
                contenido: 'La simulación de fluidos puede mejorar significativamente la calidad visual de tus proyectos...',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/riggingtips.appspot.com/o/images%2Ffluid_simulation.jpg?alt=media',
                publico: true,
                fechaCreacion: new Date()
            }
        ];
        
        for (const nodo of nodos) {
            await db.collection('nodos').add(nodo);
        }
        
        console.log(`${nodos.length} nodos creados`);
    } catch (error) {
        console.error('Error al crear nodos:', error);
        throw error;
    }
} 