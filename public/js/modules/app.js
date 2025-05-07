// Módulo principal de la aplicación
const app = {
    // Variables globales
    categorias: [],
    allNodos: [],
    currentFilter: '',
    currentPage: 1,
    itemsPerPage: 25, // 5x5 grid
    sortOrder: 'nuevo', // valores posibles: 'nuevo', 'antiguo'
    
    async init() {
        try {
            // Esperar a que Firebase esté inicializado
            if (!window.firebaseService) {
                setTimeout(() => this.init(), 100);
                return;
            }

            const { db } = window.firebaseService;
            
            // Inicializar búsqueda
            this.setupSearch();
            
            // Inicializar control de ordenamiento
            this.setupSortControl();
            
            // Cargar datos iniciales
            await this.loadData();
            
            console.log('Aplicación inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
        }
    },

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput && searchBtn) {
            // Búsqueda al hacer clic en el botón
            searchBtn.addEventListener('click', () => this.performSearch(searchInput.value));
            
            // Búsqueda al presionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
            
            // Búsqueda a medida que se escribe (con delay)
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 500); // 500ms de delay para evitar muchas consultas
            });
        }
    },
    
    setupSortControl() {
        // Crear el control de ordenamiento
        const searchContainer = document.querySelector('.search-container');
        
        if (searchContainer) {
            const sortControl = document.createElement('div');
            sortControl.className = 'sort-control';
            sortControl.innerHTML = `
                <label for="sortSelect">Ordenar por:</label>
                <select id="sortSelect">
                    <option value="nuevo" selected>Más recientes primero</option>
                    <option value="antiguo">Más antiguos primero</option>
                </select>
            `;
            
            // Insertar después del contenedor de búsqueda
            searchContainer.parentNode.insertBefore(sortControl, searchContainer.nextSibling);
            
            // Agregar event listener
            document.getElementById('sortSelect').addEventListener('change', (e) => {
                this.sortOrder = e.target.value;
                this.loadData();
            });
        }
    },

    async loadData() {
        try {
            const { db } = window.firebaseService;
            console.log('Cargando datos desde Firestore...');
            
            // Cargar categorías
            const categoriasSnapshot = await db.collection('categorias').get();
            const categoriasBar = document.getElementById('categoriasBar');
            
            // Guardar las categorías para uso posterior (colores)
            this.categorias = categoriasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Cargar nodos PÚBLICOS (publico = true)
            let query = db.collection('nodos').where('publico', '==', true);
            
            // Aplicar ordenamiento
            if (this.sortOrder === 'nuevo') {
                query = query.orderBy('creado', 'desc');
            } else if (this.sortOrder === 'antiguo') {
                query = query.orderBy('creado', 'asc');
            }
            
            const nodosSnapshot = await query.get();
            
            if (nodosSnapshot.empty) {
                console.log('No hay nodos públicos disponibles en la colección "nodos"');
                
                const nodosGrid = document.getElementById('nodosGrid');
                nodosGrid.innerHTML = `
                    <div class="mensaje-informativo">
                        <p>No hay datos disponibles en este momento.</p>
                        <p>Revisa la consola para más información.</p>
                    </div>
                `;
                return;
            }

            console.log(`Se encontraron ${nodosSnapshot.size} nodos públicos`);
            
            // Guardar todos los nodos
            this.allNodos = nodosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Reiniciar a la primera página al cambiar los datos
            this.currentPage = 1;
            
            // Renderizar categorías
            this.renderCategorias();
            
            // Renderizar nodos
            this.renderNodos();
            
        } catch (error) {
            console.error('Error al cargar los datos:', error);
            
            const nodosGrid = document.getElementById('nodosGrid');
            nodosGrid.innerHTML = `
                <div class="error-mensaje">
                    <p>Error al cargar los datos. Por favor, intenta más tarde.</p>
                    <p><small>${error.message}</small></p>
                </div>
            `;
        }
    },
    
    renderCategorias() {
        if (!this.categorias) return;
        
        const categoriasBar = document.getElementById('categoriasBar');
        if (!categoriasBar) return;
        
        categoriasBar.innerHTML = `
            <button class="categoria-btn ${!this.currentFilter ? 'active' : ''}" data-categoria="todas">
                Todas <span class="category-count">${this.getCategoryCount('')}</span>
            </button>
        `;
        
        this.categorias.forEach(categoria => {
            if (categoria && categoria.nombre) {
                const categoriaBtn = document.createElement('button');
                categoriaBtn.className = 'categoria-btn';
                categoriaBtn.setAttribute('data-categoria', categoria.nombre);
                
                // Verificar si esta categoría está activa
                if (this.currentFilter === categoria.nombre) {
                    categoriaBtn.classList.add('active');
                }
                
                // Agregar contador de tips
                const count = this.getCategoryCount(categoria.nombre);
                
                // Aplicar estilo de color si existe
                if (categoria.color) {
                    categoriaBtn.style.backgroundColor = `${categoria.color}40`; // Versión transparente
                    categoriaBtn.style.borderColor = categoria.color;
                    categoriaBtn.style.color = this.getContrastColor(categoria.color);
                }
                
                categoriaBtn.innerHTML = `${categoria.nombre} <span class="category-count">${count}</span>`;
                categoriaBtn.addEventListener('click', () => this.filtrarPorCategoria(categoria.nombre));
                categoriasBar.appendChild(categoriaBtn);
            }
        });
        
        // Agregar evento al botón "Todas"
        const btnTodas = categoriasBar.querySelector('[data-categoria="todas"]');
        if (btnTodas) {
            btnTodas.addEventListener('click', () => {
                this.currentFilter = '';
                this.loadData();
            });
        }
    },
    
    // Obtener el conteo de tips para una categoría
    getCategoryCount(categoria) {
        if (!categoria) {
            return this.allNodos.length;
        }
        return this.allNodos.filter(nodo => nodo.categoria === categoria).length;
    },

    async filtrarPorCategoria(categoria) {
        try {
            this.currentFilter = categoria;
            
            const { db } = window.firebaseService;
            
            // Actualizar botones de categoría
            const botones = document.querySelectorAll('.categoria-btn');
            botones.forEach(btn => {
                if (btn.getAttribute('data-categoria') === categoria) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Filtrar nodos públicos por categoría
            let query = db.collection('nodos')
                .where('categoria', '==', categoria)
                .where('publico', '==', true);
            
            // Aplicar ordenamiento
            if (this.sortOrder === 'nuevo') {
                query = query.orderBy('creado', 'desc');
            } else if (this.sortOrder === 'antiguo') {
                query = query.orderBy('creado', 'asc');
            }
            
            const nodosSnapshot = await query.get();
            
            // Actualizar la lista de nodos
            this.allNodos = nodosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Reiniciar a primera página
            this.currentPage = 1;
            
            // Renderizar nodos filtrados
            this.renderNodos();
            
        } catch (error) {
            console.error('Error al filtrar por categoría:', error);
            
            const nodosGrid = document.getElementById('nodosGrid');
            nodosGrid.innerHTML = `
                <div class="error-mensaje">
                    <p>Error al filtrar por categoría:</p>
                    <p><small>${error.message}</small></p>
                </div>
            `;
        }
    },

    async performSearch(query) {
        if (!query.trim()) {
            await this.loadData(); // Si la búsqueda está vacía, mostrar todos
            return;
        }

        try {
            const { db } = window.firebaseService;
            const queryLower = query.toLowerCase();
            
            // Obtener todos los nodos públicos y luego filtrar manualmente
            const snapshot = await db.collection('nodos')
                .where('publico', '==', true)
                .get();
            
            let resultados = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                // Verificamos si contiene el texto de búsqueda
                if ((data.titulo && data.titulo.toLowerCase().includes(queryLower)) ||
                    (data.descripcion && data.descripcion.toLowerCase().includes(queryLower)) ||
                    (data.contenido && data.contenido.toLowerCase().includes(queryLower))) {
                    resultados.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            
            // Ordenar resultados
            if (this.sortOrder === 'nuevo') {
                resultados.sort((a, b) => {
                    const dateA = a.creado ? new Date(a.creado.seconds * 1000) : new Date(0);
                    const dateB = b.creado ? new Date(b.creado.seconds * 1000) : new Date(0);
                    return dateB - dateA;
                });
            } else {
                resultados.sort((a, b) => {
                    const dateA = a.creado ? new Date(a.creado.seconds * 1000) : new Date(0);
                    const dateB = b.creado ? new Date(b.creado.seconds * 1000) : new Date(0);
                    return dateA - dateB;
                });
            }
            
            // Actualizar la lista de nodos
            this.allNodos = resultados;
            
            // Reiniciar a primera página
            this.currentPage = 1;
            
            // Renderizar nodos con la búsqueda
            this.renderNodos();
            
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
        }
    },

    renderNodos() {
        const nodosGrid = document.getElementById('nodosGrid');
        nodosGrid.innerHTML = ''; // Limpiar grid existente
        
        if (this.allNodos.length === 0) {
            nodosGrid.innerHTML = '<p class="no-results">No se encontraron resultados</p>';
            return;
        }
        
        // Calcular paginación
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.allNodos.length);
        const paginatedNodos = this.allNodos.slice(startIndex, endIndex);
        
        // Crear grid para los nodos
        const nodosContainer = document.createElement('div');
        nodosContainer.className = 'nodos-grid';
        nodosGrid.appendChild(nodosContainer);
        
        // Renderizar cada nodo
        paginatedNodos.forEach(nodo => {
            this.renderNodo(nodo, nodo.id, nodosContainer);
        });
        
        // Crear controles de paginación si hay más de una página
        if (this.allNodos.length > this.itemsPerPage) {
            const totalPages = Math.ceil(this.allNodos.length / this.itemsPerPage);
            
            const paginationControls = document.createElement('div');
            paginationControls.className = 'pagination-controls';
            
            // Información de paginación
            paginationControls.innerHTML = `
                <div class="pagination-info">
                    Mostrando ${startIndex + 1}-${endIndex} de ${this.allNodos.length} tips
                </div>
                <div class="pagination-buttons">
                    <button class="pagination-btn" id="prevPage" ${this.currentPage === 1 ? 'disabled' : ''}>
                        &laquo; Anterior
                    </button>
                    <span class="page-indicator">Página ${this.currentPage} de ${totalPages}</span>
                    <button class="pagination-btn" id="nextPage" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        Siguiente &raquo;
                    </button>
                </div>
            `;
            
            nodosGrid.appendChild(paginationControls);
            
            // Event listeners para paginación
            document.getElementById('prevPage').addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderNodos();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
            
            document.getElementById('nextPage').addEventListener('click', () => {
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderNodos();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
    },

    renderNodo(nodo, id, container) {
        const nodoElement = document.createElement('div');
        nodoElement.className = 'nodo-card';
        nodoElement.setAttribute('data-id', id);
        
        // Asegurarse de que todos los campos necesarios existan
        const titulo = nodo.titulo || 'Sin título';
        const descripcion = nodo.descripcion || 'Sin descripción';
        const categoria = nodo.categoria || 'Sin categoría';
        
        // Obtener color de la categoría
        let categoriaColor = '#4caf50'; // Color por defecto
        
        // Buscar la categoría en la lista de categorías
        const categoriaObj = this.categorias.find(cat => cat.nombre === categoria);
        if (categoriaObj && categoriaObj.color) {
            categoriaColor = categoriaObj.color;
        }
        
        // Preparar contenido multimedia
        let mediaHTML = '';
        if (nodo.imagen) {
            mediaHTML = `
                <div class="media-container">
                    <img src="${nodo.imagen}" alt="${titulo}" loading="lazy" onerror="this.src='https://placehold.co/600x400?text=Imagen+no+disponible'">
                    ${nodo.video ? '<div class="video-indicator">▶</div>' : ''}
                </div>
            `;
        }
        
        // Formatear fecha de creación si existe
        let fechaHTML = '';
        if (nodo.creado) {
            const fecha = new Date(nodo.creado.seconds * 1000);
            const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
            fechaHTML = `<span class="fecha-creacion">Añadido: ${fecha.toLocaleDateString('es-ES', opciones)}</span>`;
        }
        
        nodoElement.innerHTML = `
            ${mediaHTML}
            <h3>${titulo}</h3>
            <p>${descripcion}</p>
            <div class="nodo-footer">
                <span class="categoria" style="background-color: ${categoriaColor}80; color: ${this.getContrastColor(categoriaColor)}">
                    <span class="categoria-color-indicator" style="background-color: ${categoriaColor}"></span>
                    ${categoria}
                </span>
                ${fechaHTML}
            </div>
        `;
        container.appendChild(nodoElement);
        
        // Agregar evento de clic a toda la tarjeta
        nodoElement.addEventListener('click', () => {
            this.verDetalles(id);
        });
    },

    // Función de utilidad para determinar el color de texto según el fondo
    getContrastColor(hexColor) {
        // Convertir hex a RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calcular luminosidad
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Retornar negro o blanco según luminosidad
        return luminance > 0.5 ? '#000000' : '#ffffff';
    },

    async verDetalles(id) {
        try {
            const { db } = window.firebaseService;
            const doc = await db.collection('nodos').doc(id).get();
            
            if (!doc.exists) {
                console.error('Nodo no encontrado');
                return;
            }

            const nodo = doc.data();
            
            // Verificar que el nodo sea público
            if (nodo.publico !== true) {
                console.warn('Intento de acceder a un nodo privado');
                return;
            }
            
            // Crear modal
            const modalBg = document.createElement('div');
            modalBg.className = 'modal-bg';
            
            // Cerrar al hacer clic fuera
            modalBg.addEventListener('click', (e) => {
                if (e.target === modalBg) {
                    document.body.removeChild(modalBg);
                }
            });
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            
            // Crear botón de cierre separado
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modalBg);
            });
            
            // Preparar contenido multimedia
            let mediaHTML = '';
            if (nodo.imagen) {
                if (nodo.video) {
                    mediaHTML = `<video src="${nodo.video}" poster="${nodo.imagen}" controls></video>`;
                } else {
                    mediaHTML = `<img src="${nodo.imagen}" alt="${nodo.titulo}">`;
                }
            }
            
            // Formatear fecha de creación si existe
            let fechaHTML = '';
            if (nodo.creado) {
                const fecha = new Date(nodo.creado.seconds * 1000);
                const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
                fechaHTML = `<span class="fecha-creacion">Añadido: ${fecha.toLocaleDateString('es-ES', opciones)}</span>`;
            }
            
            // Obtener color de la categoría
            let categoriaColor = '#4caf50'; // Color por defecto
            const categoriaObj = this.categorias.find(cat => cat.nombre === nodo.categoria);
            if (categoriaObj && categoriaObj.color) {
                categoriaColor = categoriaObj.color;
            }
            
            modal.innerHTML = `
                ${mediaHTML}
                <h3>${nodo.titulo || 'Sin título'}</h3>
                <p>${nodo.descripcion || 'Sin descripción'}</p>
                ${nodo.contenido ? `<div class="contenido">${nodo.contenido}</div>` : ''}
                <div class="modal-footer">
                    <span class="categoria" style="background-color: ${categoriaColor}80; color: ${this.getContrastColor(categoriaColor)}">
                        <span class="categoria-color-indicator" style="background-color: ${categoriaColor}"></span>
                        ${nodo.categoria || 'Sin categoría'}
                    </span>
                    ${fechaHTML}
                </div>
            `;
            
            // Agregar elementos al DOM
            modalBg.appendChild(modal);
            modalBg.appendChild(closeBtn); // Agregar botón de cierre al fondo del modal
            document.body.appendChild(modalBg);
            
        } catch (error) {
            console.error('Error al obtener detalles del nodo:', error);
        }
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => app.init()); 