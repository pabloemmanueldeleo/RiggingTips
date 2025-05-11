// Mostrar botones de categorías leyendo desde Firestore
// Agregar almacenamiento local de nodos públicos
let allNodosPublicos = [];

const categoriasModule = {
    db: null,
    categoriasBar: null,
    categorias: [],

    init() {
        this.db = firebase.firestore();
        this.categoriasBar = document.getElementById('categoriasBar');
        this.cargarCategorias();
    },

    async cargarCategorias() {
        try {
            const snapshot = await this.db.collection('categorias').get();
            this.categorias = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Cargar todos los nodos públicos una sola vez
            const nodosSnap = await this.db.collection('nodos').where('publico', '==', true).get();
            allNodosPublicos = nodosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderCategorias();
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            // Cargar categorías por defecto si hay error
            this.categorias = [
                { id: 'modelado', nombre: 'Modelado', color: '#4CAF50' },
                { id: 'rig', nombre: 'Rigging', color: '#2196F3' },
                { id: 'animacion', nombre: 'Animación', color: '#F44336' },
                { id: 'renderizado', nombre: 'Renderizado', color: '#FF9800' },
                { id: 'efectos', nombre: 'Efectos', color: '#9C27B0' }
            ];
            allNodosPublicos = [];
            this.renderCategorias();
        }
    },

    async getCategoryCount(categoria) {
        try {
            let query = this.db.collection('nodos');
            if (categoria) {
                query = query.where('categoria', '==', categoria);
            }
            const snapshot = await query.get();
            return snapshot.size;
        } catch (error) {
            console.error('Error al obtener conteo:', error);
            return 0;
        }
    },

    renderCategorias() {
        if (!this.categoriasBar) return;
        // Calcular conteos en memoria
        const totalCount = allNodosPublicos.length;
        let botonesHtml = `
            <button class="categoria-btn active" data-categoria="todos" style="--categoria-color: #006874;">
                Todas <span class="category-count">${totalCount}</span>
            </button>
        `;
        for (const categoria of this.categorias) {
            const count = allNodosPublicos.filter(nodo => nodo.categoria === categoria.id).length;
            const colorHex = categoria.color || '#666';
            botonesHtml += `
                <button class="categoria-btn" 
                        data-categoria="${categoria.id}"
                        style="--categoria-color: ${colorHex}; background-color: ${colorHex}20; border-color: ${colorHex};">
                    ${categoria.nombre}
                    <span class="category-count">${count}</span>
                </button>
            `;
        }
        this.categoriasBar.innerHTML = botonesHtml;
        // Eventos de click
        this.categoriasBar.addEventListener('click', (e) => {
            if (e.target.classList.contains('categoria-btn')) {
                const categoriaId = e.target.dataset.categoria;
                document.querySelectorAll('.categoria-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                // Si es "todos", limpiar filtro
                if (categoriaId === 'todos') {
                    window.dispatchEvent(new CustomEvent('filtrarPorCategoria', {
                        detail: { categoria: '' }
                    }));
                } else {
                    window.dispatchEvent(new CustomEvent('filtrarPorCategoria', {
                        detail: { categoria: categoriaId }
                    }));
                }
            }
        });
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    categoriasModule.init();
}); 