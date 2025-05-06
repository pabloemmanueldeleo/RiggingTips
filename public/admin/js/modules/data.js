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
            const snapshot = await this.db.collection('categorias').get();
            return snapshot.docs.map(doc => doc.data().nombre);
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            throw error;
        }
    },

    async getTips() {
        try {
            const db = window.firebaseService.getDb();
            const snapshot = await db.collection('nodos').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al cargar tips:', error);
            throw error;
        }
    },

    async saveTip(tipData, tipId = null) {
        try {
            const db = window.firebaseService.getDb();
            const storage = window.firebaseService.getStorage();
            const formData = { ...tipData };

            // Manejar archivos si existen
            if (formData.imagenFile) {
                formData.imagen = await this.uploadFile(storage, formData.imagenFile, 'imagenes');
                delete formData.imagenFile;
            }
            
            if (formData.videoFile) {
                formData.video = await this.uploadFile(storage, formData.videoFile, 'videos');
                delete formData.videoFile;
            }

            // Actualizar fechas
            formData.fechaActualizacion = new Date();
            
            if (tipId) {
                await db.collection('nodos').doc(tipId).update(formData);
                return tipId;
            } else {
                formData.fechaCreacion = new Date();
                const docRef = await db.collection('nodos').add(formData);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error al guardar tip:', error);
            throw error;
        }
    },

    async deleteTip(tipId) {
        try {
            const db = window.firebaseService.getDb();
            await db.collection('nodos').doc(tipId).delete();
        } catch (error) {
            console.error('Error al eliminar tip:', error);
            throw error;
        }
    },

    async uploadFile(storage, file, folder) {
        const extension = file.name.split('.').pop();
        const filename = `${Date.now()}.${extension}`;
        const ref = storage.ref(`${folder}/${filename}`);
        await ref.put(file);
        return await ref.getDownloadURL();
    }
}; 