// Módulo de operaciones con base de datos
const Database = {
    // Obtener nodos visibles
    async getNodosVisibles() {
        try {
            const snapshot = await firebase.firestore()
                .collection('nodos')
                .where('visible', '==', true)
                .orderBy('orden', 'asc')
                .get();
            return this.procesarNodos(snapshot);
        } catch (error) {
            console.error('Error al obtener nodos:', error);
            return [];
        }
    },

    // Obtener nodos por categoría
    async getNodosPorCategoria(categoria) {
        try {
            const snapshot = await firebase.firestore()
                .collection('nodos')
                .where('categoria', '==', categoria)
                .where('visible', '==', true)
                .orderBy('orden', 'asc')
                .get();
            return this.procesarNodos(snapshot);
        } catch (error) {
            console.error('Error al obtener nodos por categoría:', error);
            return [];
        }
    },

    // Buscar nodos
    async buscarNodos(termino) {
        try {
            const snapshot = await firebase.firestore()
                .collection('nodos')
                .where('visible', '==', true)
                .orderBy('orden', 'asc')
                .get();
            
            const nodos = this.procesarNodos(snapshot);
            return nodos.filter(nodo => 
                (nodo.titulo?.toLowerCase().includes(termino.toLowerCase()) || false) ||
                (nodo.descripcion?.toLowerCase().includes(termino.toLowerCase()) || false)
            );
        } catch (error) {
            console.error('Error al buscar nodos:', error);
            return [];
        }
    },

    // Procesar nodos desde snapshot
    procesarNodos(snapshot) {
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                titulo: data.nombre || 'Sin título',
                descripcion: data.descripcion || 'Sin descripción',
                categoria: data.categoria || 'Sin categoría',
                url: data.url || '',
                imagen: data.imagen || '',
                orden: data.orden || 0,
                visible: data.visible || false
            };
        });
    },

    // Obtener categorías desde Firestore
    async getCategorias() {
        try {
            const snapshot = await firebase.firestore()
                .collection('categories')
                .orderBy('orden', 'asc')
                .get();
            
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    nombre: data.nombre || '',
                    descripcion: data.descripcion || '',
                    orden: data.orden || 0
                };
            });
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            return [];
        }
    }
};

export default Database; 