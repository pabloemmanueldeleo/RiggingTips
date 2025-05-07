// Script para verificar la existencia de datos e inicializar si es necesario
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que Firebase esté inicializado
    const checkFirebase = () => {
        if (window.firebaseService && window.firebaseService.initialized) {
            verifyDataExists();
        } else {
            setTimeout(checkFirebase, 100);
        }
    };
    
    checkFirebase();
});

// Verificar si existen datos en la BD
async function verifyDataExists() {
    try {
        const { db } = window.firebaseService;
        
        // Verificar categorías
        const categoriasSnapshot = await db.collection('categorias').limit(1).get();
        
        // Verificar nodos
        const nodosSnapshot = await db.collection('nodos').limit(1).get();
        
        // Si no existen datos, inicializar con ejemplos
        if (categoriasSnapshot.empty || nodosSnapshot.empty) {
            console.log('No se encontraron datos en la base de datos. Inicializando datos de ejemplo...');
            initDemoData();
        } else {
            console.log('Base de datos ya contiene datos.');
        }
    } catch (error) {
        console.error('Error al verificar datos:', error);
    }
}

// Importar datos de ejemplo
async function initDemoData() {
    // Ejecutar el script de datos de ejemplo
    if (typeof initDatabase === 'function') {
        console.log('Iniciando carga de datos de ejemplo...');
        initDatabase();
    } else {
        console.error('La función initDatabase no está disponible.');
        
        // Cargar el script de datos si no está disponible
        const script = document.createElement('script');
        script.src = 'js/database-seed.js';
        script.onload = () => {
            console.log('Script de datos cargado. Inicializando...');
            if (typeof initDatabase === 'function') {
                initDatabase();
            } else {
                console.error('No se pudo encontrar la función initDatabase.');
            }
        };
        document.head.appendChild(script);
    }
} 