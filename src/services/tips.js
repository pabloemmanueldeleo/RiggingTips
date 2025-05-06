import { db } from './firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export class TipsService {
    constructor() {
        this.tipsCollection = collection(db, 'tips');
    }

    async getAllTips() {
        try {
            const snapshot = await getDocs(this.tipsCollection);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al obtener tips:', error);
            throw error;
        }
    }

    async getTipsByCategory(categoria) {
        try {
            const q = query(
                this.tipsCollection,
                where('categoria', '==', categoria),
                orderBy('titulo')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al filtrar por categoría:', error);
            throw error;
        }
    }

    getCategorias() {
        return [
            'programación',
            'bolsa',
            'rigging',
            'errores',
            'matemáticas',
            'nodos',
            'pipeline'
        ];
    }
} 