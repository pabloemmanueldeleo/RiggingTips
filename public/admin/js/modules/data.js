// Módulo de datos
export const data = {
    db: null,
    storage: null,

    init() {
        this.db = firebase.firestore();
        this.storage = firebase.storage();
    },

    async getNodos() {
        try {
            const snapshot = await this.db.collection('nodos').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al obtener nodos:', error);
            throw error;
        }
    },

    async saveNodo(nodoData) {
        try {
            if (nodoData.id) {
                await this.db.collection('nodos').doc(nodoData.id).update(nodoData);
            } else {
                await this.db.collection('nodos').add(nodoData);
            }
        } catch (error) {
            console.error('Error al guardar nodo:', error);
            throw error;
        }
    },

    async deleteNodo(nodoId) {
        try {
            await this.db.collection('nodos').doc(nodoId).delete();
        } catch (error) {
            console.error('Error al eliminar nodo:', error);
            throw error;
        }
    },

    async uploadImage(file) {
        try {
            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(`nodos/${Date.now()}_${file.name}`);
            await fileRef.put(file);
            return await fileRef.getDownloadURL();
        } catch (error) {
            console.error('Error al subir imagen:', error);
            throw error;
        }
    },

    async getCategorias() {
        try {
            const db = window.firebaseService.db;
            const snapshot = await db.collection('categorias').get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            throw error;
        }
    },

    async getTips(categoria = null) {
        try {
            const db = window.firebaseService.db;
            let query = db.collection('nodos');
            
            if (categoria) {
                query = query.where('categoria', '==', categoria);
            }
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al obtener tips:', error);
            throw error;
        }
    },

    async buscarTips(termino) {
        try {
            const db = window.firebaseService.db;
            const snapshot = await db.collection('nodos').get();
            
            const terminos = termino.toLowerCase().split(' ');
            
            return snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(tip => {
                    const titulo = (tip.titulo || '').toLowerCase();
                    const descripcion = (tip.descripcion || '').toLowerCase();
                    const contenido = (tip.contenido || '').toLowerCase();
                    
                    return terminos.some(t => 
                        titulo.includes(t) || 
                        descripcion.includes(t) || 
                        contenido.includes(t)
                    );
                });
        } catch (error) {
            console.error('Error al buscar tips:', error);
            throw error;
        }
    },

    async saveTip(tipData, tipId = null) {
        try {
            const db = window.firebaseService.db;
            const firebase = window.firebaseService.firebase;
            
            const timestamp = firebase.firestore.Timestamp.now();
            const data = {
                ...tipData,
                actualizado: timestamp
            };
            
            if (tipId) {
                await db.collection('nodos').doc(tipId).update(data);
                return tipId;
            } else {
                data.creado = timestamp;
                const docRef = await db.collection('nodos').add(data);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error al guardar tip:', error);
            throw error;
        }
    },

    async deleteTip(tipId) {
        try {
            const db = window.firebaseService.db;
            await db.collection('nodos').doc(tipId).delete();
        } catch (error) {
            console.error('Error al eliminar tip:', error);
            throw error;
        }
    },

    async uploadFile(file, path) {
        try {
            const storage = window.firebaseService.storage;
            const timestamp = Date.now();
            const fileRef = storage.ref().child(`${path}/${timestamp}_${file.name}`);
            
            await fileRef.put(file);
            return await fileRef.getDownloadURL();
        } catch (error) {
            console.error('Error al subir archivo:', error);
            throw error;
        }
    }
}; 