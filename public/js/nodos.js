// Manejo de nodos
const nodosModule = {
    db: null,
    nodosGrid: null,
    searchInput: null,
    searchBtn: null,
    currentFilter: '',
    categorias: [],

    init() {
        this.db = firebase.firestore();
        this.nodosGrid = document.getElementById('nodosGrid');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.loadCategorias();
        this.setupEventListeners();
        this.loadNodos();
    },
    
    async loadCategorias() {
        try {
            const snapshot = await this.db.collection('categorias').get();
            this.categorias = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            this.categorias = [];
        }
    },

    setupEventListeners() {
        // Búsqueda
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.searchBtn.addEventListener('click', () => this.handleSearch());

        // Filtrado por categoría
        window.addEventListener('filtrarPorCategoria', (e) => {
            this.currentFilter = e.detail.categoria;
            this.loadNodos();
        });
    },

    async loadNodos() {
        try {
            let query = this.db.collection('nodos');
            
            if (this.currentFilter) {
                query = query.where('categoria', '==', this.currentFilter);
            }

            const snapshot = await query.get();
            const nodos = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    titulo: data.titulo || data.nombre || 'Sin título',
                    descripcion: data.descripcion || 'Sin descripción',
                    categoria: data.categoria || 'Sin categoría',
                    imagen: data.imagen || (data.media && data.media.principal) || '',
                    video: data.video || (data.media && data.media.video) || '',
                    contenido: data.contenido || '',
                    url: data.url || ''
                };
            });

            this.renderNodos(nodos);
        } catch (error) {
            console.error('Error al cargar nodos:', error);
            this.nodosGrid.innerHTML = '<p class="error-message">Error al cargar los tips. Por favor, intenta de nuevo.</p>';
        }
    },

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        this.loadNodosWithSearch(searchTerm);
    },

    async loadNodosWithSearch(searchTerm) {
        try {
            let query = this.db.collection('nodos');
            const snapshot = await query.get();
            const nodos = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    titulo: data.titulo || data.nombre || 'Sin título',
                    descripcion: data.descripcion || 'Sin descripción',
                    categoria: data.categoria || 'Sin categoría',
                    imagen: data.imagen || (data.media && data.media.principal) || '',
                    video: data.video || (data.media && data.media.video) || '',
                    contenido: data.contenido || '',
                    url: data.url || ''
                };
            }).filter(nodo => 
                nodo.titulo.toLowerCase().includes(searchTerm) ||
                nodo.descripcion.toLowerCase().includes(searchTerm)
            );

            if (this.currentFilter) {
                const filteredNodos = nodos.filter(nodo => 
                    nodo.categoria === this.currentFilter
                );
                this.renderNodos(filteredNodos);
            } else {
                this.renderNodos(nodos);
            }
        } catch (error) {
            console.error('Error en la búsqueda:', error);
        }
    },
    
    getCategoryColor(categoria) {
        const cat = this.categorias.find(c => c.nombre === categoria);
        return cat ? cat.color : '#666';
    },

    renderNodos(nodos) {
        if (!this.nodosGrid) return;

        if (nodos.length === 0) {
            this.nodosGrid.innerHTML = '<p class="no-results">No se encontraron tips. ¡Sé el primero en compartir uno!</p>';
            return;
        }

        this.nodosGrid.innerHTML = nodos.map(nodo => {
            const categoriaColor = this.getCategoryColor(nodo.categoria);
            
            return `
                <div class="card" data-id="${nodo.id}">
                    ${nodo.imagen ? `
                        <div class="card-media">
                            <img src="${nodo.imagen}" alt="${nodo.titulo}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=Imagen+no+disponible'">
                            ${nodo.video ? '<span class="video-indicator">▶</span>' : ''}
                        </div>
                    ` : ''}
                    <div class="card-content">
                        <h3>${nodo.titulo}</h3>
                        <p>${nodo.descripcion}</p>
                        <div class="card-footer">
                            <span class="categoria-tag" style="background-color: ${categoriaColor}20; color: ${categoriaColor}; border: 1px solid ${categoriaColor};">
                                <span class="categoria-color-indicator" style="background-color: ${categoriaColor};"></span>
                                ${nodo.categoria}
                            </span>
                            ${nodo.url ? `<a href="${nodo.url}" target="_blank" class="btn-link">Ver más</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Agregar evento click a las cards
        this.nodosGrid.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const nodo = nodos.find(n => n.id === card.dataset.id);
                if (nodo) this.mostrarModalNodo(nodo);
            });
        });
    },

    mostrarModalNodo(nodo) {
        const modalBg = document.createElement('div');
        modalBg.className = 'modal-bg';
        modalBg.onclick = (e) => { if (e.target === modalBg) document.body.removeChild(modalBg); };

        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const categoriaColor = this.getCategoryColor(nodo.categoria);
        
        let mediaHtml = '';
        if (nodo.video) {
            mediaHtml = `<video src="${nodo.video}" controls></video>`;
        } else if (nodo.imagen) {
            mediaHtml = `<img src="${nodo.imagen}" alt="${nodo.titulo}" onerror="this.style.display='none'">`;
        }

        modal.innerHTML = `
            <button class="close-btn" onclick="document.body.removeChild(this.parentNode.parentNode)">&times;</button>
            ${mediaHtml}
            <h3>${nodo.titulo}</h3>
            <p>${nodo.descripcion}</p>
            ${nodo.contenido ? `<div class="contenido">${nodo.contenido}</div>` : ''}
            <div class="modal-footer">
                <span class="categoria-tag" style="background-color: ${categoriaColor}20; color: ${categoriaColor}; border: 1px solid ${categoriaColor};">
                    <span class="categoria-color-indicator" style="background-color: ${categoriaColor};"></span>
                    ${nodo.categoria}
                </span>
                ${nodo.url ? `<a href="${nodo.url}" target="_blank" class="btn-primary">Ver recurso completo</a>` : ''}
            </div>
        `;

        modalBg.appendChild(modal);
        document.body.appendChild(modalBg);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    nodosModule.init();
}); 