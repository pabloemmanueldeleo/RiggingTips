// Módulo principal de la aplicación
const app = {
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
            
            if (!categoriasSnapshot.empty) {
                categoriasBar.innerHTML = `
                    <button class="categoria-btn active" data-categoria="todas">Todas</button>
                `;
                
                categoriasSnapshot.forEach(doc => {
                    const categoria = doc.data();
                    if (categoria && categoria.nombre) {
                        const categoriaBtn = document.createElement('button');
                        categoriaBtn.className = 'categoria-btn';
                        categoriaBtn.setAttribute('data-categoria', categoria.nombre);
                        
                        // Aplicar estilo de color si existe
                        if (categoria.color) {
                            categoriaBtn.style.backgroundColor = `${categoria.color}40`; // Versión transparente
                            categoriaBtn.style.borderColor = categoria.color;
                            categoriaBtn.style.color = this.getContrastColor(categoria.color);
                        }
                        
                        categoriaBtn.textContent = categoria.nombre;
                        categoriaBtn.addEventListener('click', () => this.filtrarPorCategoria(categoria.nombre));
                        categoriasBar.appendChild(categoriaBtn);
                    }
                });
                
                // Agregar evento al botón "Todas"
                const btnTodas = categoriasBar.querySelector('[data-categoria="todas"]');
                if (btnTodas) {
                    btnTodas.addEventListener('click', () => this.loadData());
                }
            }
            
            // Cargar nodos PÚBLICOS (publico = true)
            const nodosSnapshot = await db.collection('nodos')
                .where('publico', '==', true)
                .get();
            
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
            
            const nodosGrid = document.getElementById('nodosGrid');
            nodosGrid.innerHTML = ''; // Limpiar grid existente
            
            nodosSnapshot.forEach(doc => {
                const nodo = doc.data();
                this.renderNodo(nodo, doc.id);
            });
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

    async filtrarPorCategoria(categoria) {
        try {
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
            const nodosSnapshot = await db.collection('nodos')
                .where('categoria', '==', categoria)
                .where('publico', '==', true)
                .get();
            
            const nodosGrid = document.getElementById('nodosGrid');
            nodosGrid.innerHTML = '';
            
            if (nodosSnapshot.empty) {
                nodosGrid.innerHTML = `
                    <div class="mensaje-informativo">
                        <p>No hay tips en la categoría "${categoria}".</p>
                    </div>
                `;
                return;
            }
            
            nodosSnapshot.forEach(doc => {
                const nodo = doc.data();
                this.renderNodo(nodo, doc.id);
            });
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

            const nodosGrid = document.getElementById('nodosGrid');
            nodosGrid.innerHTML = ''; // Limpiar resultados anteriores

            if (resultados.length === 0) {
                nodosGrid.innerHTML = '<p class="no-results">No se encontraron resultados</p>';
                return;
            }

            resultados.forEach(nodo => {
                this.renderNodo(nodo, nodo.id);
            });
        } catch (error) {
            console.error('Error al realizar la búsqueda:', error);
        }
    },

    renderNodo(nodo, id) {
        const nodosGrid = document.getElementById('nodosGrid');
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
        
        nodoElement.innerHTML = `
            ${mediaHTML}
            <h3>${titulo}</h3>
            <p>${descripcion}</p>
            <div class="nodo-footer">
                <span class="categoria" style="background-color: ${categoriaColor}80; color: ${this.getContrastColor(categoriaColor)}">
                    <span class="categoria-color-indicator" style="background-color: ${categoriaColor}"></span>
                    ${categoria}
                </span>
            </div>
        `;
        nodosGrid.appendChild(nodoElement);
        
        // Agregar evento de clic a toda la tarjeta
        nodoElement.addEventListener('click', () => {
            this.verDetalles(id);
        });
        
        console.log(`Nodo renderizado: ${id} - ${titulo}`);
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
            
            modal.innerHTML = `
                ${mediaHTML}
                <h3>${nodo.titulo || 'Sin título'}</h3>
                <p>${nodo.descripcion || 'Sin descripción'}</p>
                ${nodo.contenido ? `<div class="contenido">${nodo.contenido}</div>` : ''}
                <div class="modal-footer">
                    <span class="categoria">${nodo.categoria || 'Sin categoría'}</span>
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