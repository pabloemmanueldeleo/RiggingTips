// Manejo de nodos
const nodosModule = {
    db: null,
    nodosGrid: null,
    searchInput: null,
    searchBtn: null,
    currentFilter: '',
    categorias: [],
    sortOrder: 'nuevo', // Por defecto, ordenar por más recientes
    destacadosSection: null,
    masVotadosSection: null,
    allNodos: [],

    init() {
        this.db = firebase.firestore();
        this.nodosGrid = document.getElementById('nodosGrid');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        
        // Crear secciones para destacados y más votados
        this.createAdditionalSections();
        
        this.loadCategorias();
        this.setupEventListeners();
        this.loadNodos();
    },
    
    createAdditionalSections() {
        // Crear sección de destacados si no existe
        if (!document.getElementById('destacadosSection')) {
            const container = document.querySelector('.container');
            this.destacadosSection = document.createElement('div');
            this.destacadosSection.id = 'destacadosSection';
            this.destacadosSection.className = 'destacados-section';
            this.destacadosSection.innerHTML = `
                <h2>Tips Destacados ⭐</h2>
                <div id="destacadosGrid" class="nodos-grid"></div>
            `;
            
            this.masVotadosSection = document.createElement('div');
            this.masVotadosSection.id = 'masVotadosSection';
            this.masVotadosSection.className = 'mas-votados-section';
            this.masVotadosSection.innerHTML = `
                <h2>Los Más Votados 👍</h2>
                <div id="masVotadosGrid" class="nodos-grid"></div>
            `;
            
            // Insertar después de categorias pero antes del grid principal
            container.insertBefore(this.destacadosSection, this.nodosGrid);
            container.insertBefore(this.masVotadosSection, this.nodosGrid);
            
            // Actualizar título de sección principal
            const tituloSeccionPrincipal = document.createElement('h2');
            tituloSeccionPrincipal.textContent = 'Todos los Tips';
            container.insertBefore(tituloSeccionPrincipal, this.nodosGrid);
        }
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
        
        // Botón de limpiar búsqueda
        const searchClearBtn = document.getElementById('searchClearBtn');
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.handleSearch();
                this.loadNodos(); // Recargar todos los nodos
            });
        }

        // Eliminar listeners directos a botones de categoría
        // El filtrado ahora se maneja por evento global

        // Evento para ordenar
        const sortSelect = document.getElementById('sortOrder');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortOrder = e.target.value;
                this.loadNodos();
            });
        }

        // Escuchar evento global de filtrado de categorías
        window.addEventListener('filtrarPorCategoria', (e) => {
            const categoria = e.detail.categoria || '';
            this.currentFilter = categoria;
            this.loadNodos(categoria);
        });
    },

    async loadNodos(categoriaId = '') {
        try {
            // Cargar destacados primero
            await this.loadDestacados();
            // Cargar los más votados
            await this.loadMasVotados();
            // Cargar el resto de nodos para la sección "Todos los Tips"
            let query = this.db.collection('nodos').where('publico', '==', true); // Solo tips públicos
            const searchTerm = this.searchInput.value.trim().toLowerCase();
            // Usar el id de la categoría para filtrar
            const categoriaFiltro = categoriaId || this.currentFilter;
            if (categoriaFiltro && categoriaFiltro !== 'todos') {
                query = query.where('categoria', '==', categoriaFiltro);
            }
            // Ordenar por fecha
            if (this.sortOrder === 'nuevo') {
                query = query.orderBy('fechaCreacion', 'desc');
            } else if (this.sortOrder === 'antiguo') {
                query = query.orderBy('fechaCreacion', 'asc');
            } else if (this.sortOrder === 'destacados') {
                query = query.where('destacado', '==', true).orderBy('fechaCreacion', 'desc');
            }
            const snapshot = await query.get();
            let nodos = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    titulo: data.titulo || data.nombre || 'Sin título',
                    descripcion: data.descripcion || 'Sin descripción',
                    categoria: data.categoria || 'Sin categoría', // Aquí debe ser el id
                    imagen: data.imagen || (data.media && data.media.principal) || '',
                    video: data.video || (data.media && data.media.video) || '',
                    contenido: data.contenido || '',
                    url: data.url || '',
                    fechaCreacion: data.fechaCreacion ? data.fechaCreacion.toDate() : new Date(),
                    destacado: data.destacado || false,
                    publico: data.publico !== false,
                    likes: data.likes || 0,
                    dislikes: data.dislikes || 0,
                    vistas: data.vistas || 0
                };
            });
            // Filtrar por búsqueda si hay término
            if (searchTerm) {
                nodos = nodos.filter(nodo =>
                    nodo.titulo.toLowerCase().includes(searchTerm) ||
                    nodo.descripcion.toLowerCase().includes(searchTerm)
                );
            }
            this.allNodos = nodos;
            this.renderNodos(nodos, this.nodosGrid);
        } catch (error) {
            console.error('Error al cargar nodos:', error);
            this.nodosGrid.innerHTML = '<p class="error-message">Error al cargar los tips. Por favor, intenta de nuevo.</p>';
        }
    },
    
    async loadDestacados() {
        try {
            const destacadosGrid = document.getElementById('destacadosGrid');
            if (!destacadosGrid) return;
            
            // Primero traemos todos los nodos públicos
            const snapshot = await this.db.collection('nodos')
                .where('publico', '==', true)
                .get();
            
            if (snapshot.empty) {
                this.destacadosSection.style.display = 'none';
                return;
            }
            
            // Luego filtramos manualmente los destacados
            const nodos = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        titulo: data.titulo || data.nombre || 'Sin título',
                        descripcion: data.descripcion || 'Sin descripción',
                        categoria: data.categoria || 'Sin categoría',
                        imagen: data.imagen || (data.media && data.media.principal) || '',
                        video: data.video || (data.media && data.media.video) || '',
                        contenido: data.contenido || '',
                        url: data.url || '',
                        fechaCreacion: data.fechaCreacion ? data.fechaCreacion.toDate() : new Date(),
                        destacado: data.destacado || false,
                        publico: data.publico !== false,
                        likes: data.likes || 0,
                        dislikes: data.dislikes || 0,
                        vistas: data.vistas || 0
                    };
                })
                .filter(nodo => nodo.destacado === true) // Filtrar destacados manualmente
                .sort((a, b) => b.fechaCreacion - a.fechaCreacion) // Ordenar por fecha manualmente
                .slice(0, 3); // Limitamos a 3 elementos
            
            if (nodos.length === 0) {
                this.destacadosSection.style.display = 'none';
                return;
            }
            
            this.destacadosSection.style.display = 'block';
            
            this.renderNodos(nodos, destacadosGrid);
        } catch (error) {
            console.error('Error al cargar destacados:', error);
            if (this.destacadosSection) {
                this.destacadosSection.style.display = 'none';
            }
        }
    },
    
    async loadMasVotados() {
        try {
            const masVotadosGrid = document.getElementById('masVotadosGrid');
            if (!masVotadosGrid) return;
            
            // Traemos todos los nodos públicos
            const snapshot = await this.db.collection('nodos')
                .where('publico', '==', true)
                .get();
            
            if (snapshot.empty) {
                this.masVotadosSection.style.display = 'none';
                return;
            }
            
            // Filtramos y ordenamos manualmente por likes
            const nodos = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        titulo: data.titulo || data.nombre || 'Sin título',
                        descripcion: data.descripcion || 'Sin descripción',
                        categoria: data.categoria || 'Sin categoría',
                        imagen: data.imagen || (data.media && data.media.principal) || '',
                        video: data.video || (data.media && data.media.video) || '',
                        contenido: data.contenido || '',
                        url: data.url || '',
                        fechaCreacion: data.fechaCreacion ? data.fechaCreacion.toDate() : new Date(),
                        destacado: data.destacado || false,
                        publico: data.publico !== false,
                        likes: data.likes || 0,
                        dislikes: data.dislikes || 0,
                        vistas: data.vistas || 0
                    };
                })
                .sort((a, b) => (b.likes || 0) - (a.likes || 0)) // Ordenar por likes manualmente
                .slice(0, 3); // Limitar a 3 elementos
            
            if (nodos.length === 0) {
                this.masVotadosSection.style.display = 'none';
                return;
            }
            
            this.masVotadosSection.style.display = 'block';
            
            this.renderNodos(nodos, masVotadosGrid);
        } catch (error) {
            console.error('Error al cargar más votados:', error);
            if (this.masVotadosSection) {
                this.masVotadosSection.style.display = 'none';
            }
        }
    },

    handleSearch() {
        // Al buscar, recargar nodos con el filtro actual
        this.loadNodos(this.currentFilter);
    },

    getCategoryColor(categoria) {
        const cat = this.categorias.find(c => c.nombre === categoria);
        return cat ? cat.color : '#666';
    },

    renderNodos(nodos, container) {
        if (!container) return;
        if (nodos.length === 0) {
            container.innerHTML = '<p class="no-results">No se encontraron tips. ¡Sé el primero en compartir uno!</p>';
            return;
        }
        // Crear controles de ordenamiento si no existen y es el contenedor principal
        if (container === this.nodosGrid) {
            let sortControlExists = document.querySelector('.sort-control');
            if (!sortControlExists) {
                const sortControl = document.createElement('div');
                sortControl.className = 'sort-control';
                sortControl.innerHTML = `
                    <label>Ordenar por: </label>
                    <select id="sortOrder">
                        <option value="nuevo" ${this.sortOrder === 'nuevo' ? 'selected' : ''}>Más recientes primero</option>
                        <option value="antiguo" ${this.sortOrder === 'antiguo' ? 'selected' : ''}>Más antiguos primero</option>
                        <option value="destacados" ${this.sortOrder === 'destacados' ? 'selected' : ''}>Destacados</option>
                    </select>
                `;
                container.parentNode.insertBefore(sortControl, container);
                document.getElementById('sortOrder').addEventListener('change', (e) => {
                    this.sortOrder = e.target.value;
                    this.loadNodos();
                });
            }
        }
        container.innerHTML = nodos.map(nodo => {
            const categoriaColor = this.getCategoryColor(nodo.categoria);
            const fechaFormateada = nodo.fechaCreacion instanceof Date 
                ? nodo.fechaCreacion.toLocaleDateString()
                : 'Fecha desconocida';
            return `
                <div class="card ${nodo.destacado ? 'destacado' : ''}" data-id="${nodo.id}">
                    <div class="card-media">
                        <img src="${nodo.imagen}" alt="${nodo.titulo}" loading="lazy" onerror="this.onerror=null; this.src='img/Trimm__logo_cuadrado_B.png'; this.style.objectFit='contain'; this.style.backgroundColor='white';">
                    </div>
                    <div class="card-label" style="background: ${categoriaColor}cc;">${nodo.categoria}</div>
                    <div class="card-content">
                        <h3>${nodo.titulo}</h3>
                        <p>${nodo.descripcion}</p>
                        <div class="card-stats">
                            <span class="stat-item" title="Vistas"><i class="icon-eye"></i> <span class="count">${nodo.vistas || 0}</span></span>
                            <button class="vote-btn like-btn stat-item" title="Me gusta"><i class="icon-heart"></i> <span class="count">${nodo.likes || 0}</span></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        // Eventos para feedback visual y acciones
        container.querySelectorAll('.card').forEach(card => {
            card.querySelector('.vote-btn.like-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const nodo = nodos.find(n => n.id === card.dataset.id);
                if (nodo) {
                    this.voteTip(nodo.id, 'like');
                }
            });
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('vote-btn')) return;
                const nodo = nodos.find(n => n.id === card.dataset.id);
                if (nodo) {
                    this.incrementViews(nodo.id);
                    this.mostrarModalNodo(nodo);
                }
            });
        });
    },
    
    async incrementViews(nodoId) {
        try {
            const nodoRef = this.db.collection('nodos').doc(nodoId);
            await nodoRef.update({
                vistas: firebase.firestore.FieldValue.increment(1)
            });

            // Actualizar UI en el grid principal (y otras secciones si la tarjeta está duplicada)
            document.querySelectorAll(`.card[data-id="${nodoId}"]`).forEach(cardInGrid => {
                const vistasElement = cardInGrid.querySelector('.stat-item[title="Vistas"] span.count');
                if (vistasElement) {
                    const currentVistas = parseInt(vistasElement.textContent) || 0;
                    vistasElement.textContent = currentVistas + 1;
                }
            });
            
            // Actualizar en el array local si existe
            const updateLocalData = (arr) => {
                if (arr) {
                    const nodoLocal = arr.find(n => n.id === nodoId);
                    if (nodoLocal) {
                        nodoLocal.vistas = (nodoLocal.vistas || 0) + 1;
                    }
                }
            };
            updateLocalData(this.allNodos); // Para la lista principal
            // Si tienes arrays separados para destacados/masVotados que se usan para renderizar,
            // también deberías actualizarlos aquí o asegurar que se refresquen desde allNodos.

        } catch (error) {
            console.error('Error al incrementar vistas:', error);
        }
    },
    
    async voteTip(nodoId, voteType) {
        try {
            const votedTipsKey = 'votedRiggingTips';
            let votedTips = JSON.parse(localStorage.getItem(votedTipsKey)) || [];

            if (votedTips.includes(nodoId)) {
                console.log('Este tip ya ha sido votado desde este navegador.');
                return;
            }

            console.log('Añadiendo me gusta al tip:', nodoId);
            const nodoRef = this.db.collection('nodos').doc(nodoId);
            
            const doc = await nodoRef.get();
            if (!doc.exists) {
                console.error('Error: El nodo no existe');
                return;
            }
            
            await nodoRef.update({
                likes: firebase.firestore.FieldValue.increment(1)
            });
            
            votedTips.push(nodoId);
            localStorage.setItem(votedTipsKey, JSON.stringify(votedTips));

            console.log('Like registrado correctamente');
            
            // Actualizar UI en todas partes (modal y grids)
            const newLikesCount = (doc.data().likes || 0) + 1;

            document.querySelectorAll(`.card[data-id="${nodoId}"]`).forEach(cardInGrid => {
                const likeElementInGrid = cardInGrid.querySelector('.stat-item[title="Me gusta"] span.count');
                if (likeElementInGrid) {
                    likeElementInGrid.textContent = newLikesCount;
                }
            });

            const modalInstance = document.querySelector(`.modal .vote-btn.like-btn[data-id="${nodoId}"]`);
            if (modalInstance) {
                modalInstance.innerHTML = `<i class="icon-heart"></i> ${newLikesCount}`;
                modalInstance.disabled = true;
                modalInstance.classList.add('voted');
            }
            
            // Actualizar en el array local si existe
            const updateLocalLikes = (arr) => {
                if (arr) {
                    const nodoLocalLike = arr.find(n => n.id === nodoId);
                    if (nodoLocalLike) {
                        nodoLocalLike.likes = newLikesCount;
                    }
                }
            };
            updateLocalLikes(this.allNodos);

        } catch (error) {
            console.error('Error al dar me gusta:', error);
        }
    },

    mostrarModalNodo(nodo) {
        const modalBg = document.createElement('div');
        modalBg.className = 'modal-bg';
        modalBg.onclick = (e) => { if (e.target === modalBg) document.body.removeChild(modalBg); };

        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const categoriaColor = this.getCategoryColor(nodo.categoria);
        const fechaFormateada = nodo.fechaCreacion instanceof Date 
            ? nodo.fechaCreacion.toLocaleDateString()
            : 'Fecha desconocida';
        
        let mediaHtml = '';
        if (nodo.video) {
            mediaHtml = `<video src="${nodo.video}" controls></video>`;
        } else if (nodo.imagen) {
            mediaHtml = `<img src="${nodo.imagen}" alt="${nodo.titulo}" onerror="this.style.display='none'">`;
        }

        modal.innerHTML = `
            <button class="close-btn" onclick="document.body.removeChild(this.parentNode.parentNode)">&times;</button>
            ${mediaHtml}
            <h3>${nodo.titulo} ${nodo.destacado ? '<span class="destacado-badge-small">⭐</span>' : ''}</h3>
            <p>${nodo.descripcion}</p>
            ${nodo.contenido ? `<div class="contenido">${nodo.contenido}</div>` : ''}
            
            <div class="modal-stats">
                <span class="stat-item" title="Vistas"><i class="icon-eye"></i> ${nodo.vistas}</span>
                <div class="vote-buttons">
                    <button class="vote-btn like-btn" data-id="${nodo.id}" data-vote="like" title="Me gusta">
                        <i class="icon-heart"></i> ${nodo.likes || 0}
                    </button>
                </div>
            </div>
            
            <div class="modal-footer">
                <div class="modal-footer-left">
                    <span class="categoria-tag" style="background-color: ${categoriaColor}20; color: ${categoriaColor}; border: 1px solid ${categoriaColor};">
                        <span class="categoria-color-indicator" style="background-color: ${categoriaColor};"></span>
                        ${nodo.categoria}
                    </span>
                    <span class="fecha-creacion">${fechaFormateada}</span>
                </div>
                <div class="modal-footer-right">
                    ${nodo.url ? `<a href="${nodo.url}" target="_blank" class="btn-primary">Ver recurso completo</a>` : ''}
                </div>
            </div>
        `;

        modalBg.appendChild(modal);
        document.body.appendChild(modalBg);
        
        // Añadir event listeners para el botón de me gusta
        const likeBtn = modal.querySelector('.like-btn');
        
        const votedTipsKey = 'votedRiggingTips';
        let votedTips = JSON.parse(localStorage.getItem(votedTipsKey)) || [];
        if (votedTips.includes(nodo.id)) {
            likeBtn.disabled = true;
            likeBtn.classList.add('voted');
        }

        likeBtn.addEventListener('click', () => {
            this.voteTip(nodo.id, 'like');
            // El estado disabled/voted se manejará ahora dentro de voteTip si el voto es exitoso
            // o al recargar el modal si ya estaba votado.
        });
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    nodosModule.init();
});

// Exponer el módulo globalmente para integración con filtrado de categorías
window.nodosModule = nodosModule; 