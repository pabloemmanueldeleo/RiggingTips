// Módulo principal de la aplicación
const app = {
    init() {
        // Esperar a que Firebase esté inicializado
        if (!window.firebaseService) {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Inicializar búsqueda
        this.setupSearch();
        
        // Cargar datos iniciales
        this.loadData();
    },

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        searchBtn.addEventListener('click', () => {
            this.handleSearch(searchInput.value);
        });
    },

    async loadData() {
        try {
            const db = window.firebaseService.getDb();
            
            // Cargar categorías
            const categoriasSnapshot = await db.collection('categorias').get();
            const categorias = categoriasSnapshot.docs.map(doc => doc.data().nombre);
            this.renderCategorias(categorias);

            // Cargar nodos
            const nodosSnapshot = await db.collection('nodos').where('publico', '==', true).get();
            const nodos = nodosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.renderNodos(nodos);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.showError('Error al cargar los datos');
        }
    },

    renderCategorias(categorias) {
        const categoriasBar = document.getElementById('categoriasBar');
        categoriasBar.innerHTML = categorias.map(categoria => `
            <button class="categoria-btn" data-categoria="${categoria}">
                ${categoria}
            </button>
        `).join('');

        // Agregar eventos a los botones
        categoriasBar.addEventListener('click', (e) => {
            if (e.target.classList.contains('categoria-btn')) {
                const categoria = e.target.dataset.categoria;
                this.filtrarPorCategoria(categoria);
            }
        });
    },

    renderNodos(nodos) {
        const nodosGrid = document.getElementById('nodosGrid');
        nodosGrid.innerHTML = nodos.map(nodo => `
            <div class="card">
                ${nodo.imagen ? `
                    <div class="card-media">
                        <img src="${nodo.imagen}" alt="${nodo.titulo}" loading="lazy">
                        ${nodo.video ? '<span class="video-indicator">▶</span>' : ''}
                    </div>
                ` : ''}
                <div class="card-content">
                    <h3>${nodo.titulo}</h3>
                    <p>${nodo.descripcion}</p>
                    <span class="categoria-tag">${nodo.categoria}</span>
                </div>
            </div>
        `).join('');
    },

    async handleSearch(query) {
        try {
            const db = window.firebaseService.getDb();
            const nodosRef = db.collection('nodos').where('publico', '==', true);
            
            let snapshot;
            if (query) {
                // Búsqueda por título o descripción
                snapshot = await nodosRef
                    .where('titulo', '>=', query)
                    .where('titulo', '<=', query + '\uf8ff')
                    .get();
            } else {
                snapshot = await nodosRef.get();
            }

            const nodos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderNodos(nodos);
        } catch (error) {
            console.error('Error en la búsqueda:', error);
        }
    },

    async filtrarPorCategoria(categoria) {
        try {
            const db = window.firebaseService.getDb();
            const snapshot = await db.collection('nodos')
                .where('publico', '==', true)
                .where('categoria', '==', categoria)
                .get();

            const nodos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderNodos(nodos);
        } catch (error) {
            console.error('Error al filtrar por categoría:', error);
        }
    },

    showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.textContent = message;
        document.body.appendChild(errorContainer);
        
        setTimeout(() => {
            errorContainer.remove();
        }, 3000);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => app.init()); 