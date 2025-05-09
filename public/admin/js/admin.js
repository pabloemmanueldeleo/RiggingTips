// Importar módulos
import { auth } from './modules/auth.js';
import { ui } from './modules/ui.js';
import { data } from './modules/data.js';

// Módulo principal de administración
const adminModule = {
    // Variables globales
    categorias: [],
    allTips: [],
    currentFilter: '',
    user: null,
    currentPage: 1,
    itemsPerPage: 25,
    sortOrder: 'nuevo', // valores posibles: 'nuevo', 'antiguo'
    
    // Inicialización
    async init() {
        // Esperar a que Firebase esté inicializado
        if (!window.firebaseService || !window.firebaseService.initialized) {
            console.log('Esperando inicialización de Firebase...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        console.log('Inicializando panel de administración...');
        
        // Definir funciones globales para vista previa de imágenes
        window.adminModule = this; // Exponer el módulo globalmente

        // Añadir listeners a botones
        document.getElementById('loginButton')?.addEventListener('click', () => this.login());
        document.getElementById('logoutButton')?.addEventListener('click', () => this.logout());
        document.getElementById('newTipButton')?.addEventListener('click', () => this.showTipForm());
        document.getElementById('closeModalButton')?.addEventListener('click', () => this.hideModal());
        document.getElementById('cancelButton')?.addEventListener('click', () => this.hideModal());
        document.getElementById('tipForm')?.addEventListener('submit', (e) => this.saveTip(e));
        
        // Agregar botón X para limpiar búsqueda
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            const searchInput = searchBar.querySelector('input');
            if (searchInput) {
                // Añadir el botón X si no existe
                if (!document.getElementById('searchClearBtn')) {
                    const clearBtn = document.createElement('button');
                    clearBtn.id = 'searchClearBtn';
                    clearBtn.className = 'search-clear-btn';
                    clearBtn.innerHTML = '&times;';
                    clearBtn.title = 'Limpiar búsqueda';
                    
                    // Insertar después del input
                    searchInput.parentNode.insertBefore(clearBtn, searchInput.nextSibling);
                    
                    // Añadir evento al botón
                    clearBtn.addEventListener('click', () => {
                        searchInput.value = '';
                        this.loadTips(); // Recargar todos los tips
                    });
                }
                
                // Buscar a medida que se escribe con un pequeño retraso
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.handleSearch(e.target.value);
                    }, 300); // 300ms de delay para evitar muchas consultas
                });
            }
        }
        
        // Botones para gestión de categorías
        document.getElementById('manageCategoriesButton')?.addEventListener('click', () => this.showCategoriesModal());
        document.getElementById('closeCategoriesModalButton')?.addEventListener('click', () => this.hideCategoriesModal());
        document.getElementById('categoryForm')?.addEventListener('submit', (e) => this.addCategory(e));
        
        // Botones para reinicio de base de datos
        document.getElementById('resetDatabaseButton')?.addEventListener('click', () => this.showConfirmReset());
        document.getElementById('cancelResetButton')?.addEventListener('click', () => this.hideConfirmModal());
        document.getElementById('confirmResetButton')?.addEventListener('click', () => this.resetDatabase());
        
        // Botones para explorar imágenes/videos en Storage
        document.getElementById('browseStorageBtn')?.addEventListener('click', () => this.toggleStoredImagesPreview());
        document.getElementById('browseVideosBtn')?.addEventListener('click', () => this.toggleStoredVideosPreview());
        
        // Comprobar autenticación
        const { auth } = window.firebaseService;
        auth.onAuthStateChanged(async (user) => {
            this.user = user;
            if (user) {
                console.log('Usuario autenticado:', user.email);
                this.showAdminPanel();
                await this.loadCategorias();
                await this.loadTips();
            } else {
                console.log('No hay usuario autenticado');
                this.showLoginForm();
            }
        });
    },
    
    // Autenticación
    async login() {
        try {
            const { auth, firebase } = window.firebaseService;
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.showError('Error al iniciar sesión: ' + error.message);
        }
    },
    
    async logout() {
        try {
            const { auth } = window.firebaseService;
            await auth.signOut();
            this.showLoginForm();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.showError('Error al cerrar sesión: ' + error.message);
        }
    },
    
    // Interfaz de usuario
    showLoginForm() {
        document.getElementById('loginContainer').classList.remove('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    },
    
    showAdminPanel() {
        document.getElementById('loginContainer').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
    },
    
    showModal(tipId = null) {
        const modal = document.getElementById('tipModal');
        const form = document.getElementById('tipForm');
        const title = document.getElementById('modalTitle');
        
        // Limpiar formulario
        form.reset();
        
        modal.classList.remove('hidden');
        if (tipId) {
            title.textContent = 'Editar Tip';
            form.dataset.tipId = tipId;
            // Cargar datos del tip
            this.loadTipData(tipId);
        } else {
            title.textContent = 'Nuevo Tip';
            delete form.dataset.tipId;
        }
    },
    
    hideModal() {
        document.getElementById('tipModal').classList.add('hidden');
        document.getElementById('tipForm').reset();
        this.removeImagePreview();
    },
    
    showConfirmReset() {
        document.getElementById('confirmModal').classList.remove('hidden');
    },
    
    hideConfirmModal() {
        document.getElementById('confirmModal').classList.add('hidden');
    },
    
    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (!errorContainer) return;
        
        errorContainer.style.display = 'block';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorContainer.appendChild(errorDiv);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
            
            // Si no hay más mensajes, ocultar el contenedor
            if (errorContainer.children.length === 0) {
                errorContainer.style.display = 'none';
            }
        }, 5000);
    },
    
    showSuccess(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (!errorContainer) return;
        
        errorContainer.style.display = 'block';
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        errorContainer.appendChild(successDiv);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
            
            // Si no hay más mensajes, ocultar el contenedor
            if (errorContainer.children.length === 0) {
                errorContainer.style.display = 'none';
            }
        }, 5000);
    },
    
    // Carga de datos
    async loadCategorias() {
        try {
            const { db } = window.firebaseService;
            console.log('Cargando categorías...');
            const snapshot = await db.collection('categorias').get();
            
            if (snapshot.empty) {
                console.warn('No se encontraron categorías en la base de datos');
                return;
            }
            
            this.categorias = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('Categorías cargadas:', this.categorias);
            
            // Actualizar select de categorías
            const categoriaSelect = document.getElementById('categoria');
            categoriaSelect.innerHTML = '';
            
            // Asegurarnos de que existan datos en this.categorias
            if (this.categorias && this.categorias.length > 0) {
                this.categorias.forEach(categoria => {
                    console.log('Procesando categoría:', categoria);
                    if (categoria && categoria.nombre) {
                        const option = document.createElement('option');
                        option.value = categoria.nombre;
                        option.textContent = categoria.nombre;
                        categoriaSelect.appendChild(option);
                    } else {
                        console.warn('Categoría sin nombre:', categoria);
                    }
                });
            } else {
                console.warn('No hay categorías para mostrar en el select');
            }
            
            // Actualizar barra de categorías
            this.renderCategoriesBar();
            
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            this.showError('Error al cargar categorías: ' + error.message);
        }
    },
    
    async loadTips() {
        try {
            const { db } = window.firebaseService;
            let query = db.collection('nodos');
            
            if (this.currentFilter) {
                query = query.where('categoria', '==', this.currentFilter);
            }
            
            // Ordenar por fecha
            if (this.sortOrder === 'nuevo') {
                query = query.orderBy('creado', 'desc');
            } else if (this.sortOrder === 'antiguo') {
                query = query.orderBy('creado', 'asc');
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                console.log('No se encontraron tips que coincidan con el filtro actual');
            }
            
            this.allTips = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('Tips cargados:', this.allTips.length);
            this.currentPage = 1; // Reiniciar a la primera página
            this.renderTips();
            this.renderCategoriesBar(); // Actualizar conteo de categorías
            
        } catch (error) {
            console.error('Error al cargar tips:', error);
            this.showError('Error al cargar los tips: ' + error.message);
        }
    },
    
    async loadTipData(tipId) {
        try {
            const tip = this.allTips.find(t => t.id === tipId);
            
            if (tip) {
                document.getElementById('titulo').value = tip.titulo || '';
                document.getElementById('descripcion').value = tip.descripcion || '';
                document.getElementById('categoria').value = tip.categoria || '';
                document.getElementById('contenido').value = tip.contenido || '';
                document.getElementById('imagen').value = tip.imagen || '';
                document.getElementById('video').value = tip.video || '';
                document.getElementById('publico').checked = tip.publico !== false;
                
                // Mostrar vista previa de la imagen si existe
                if (tip.imagen) {
                    this.previewImageFromUrl(tip.imagen);
                } else {
                    this.removeImagePreview();
                }
            }
        } catch (error) {
            console.error('Error al cargar tip:', error);
            this.showError('Error al cargar el tip: ' + error.message);
        }
    },
    
    // Renderizado
    renderCategoriesBar() {
        const bar = document.getElementById('categoriasBar');
        
        bar.innerHTML = `
            <button class="categoria-btn ${!this.currentFilter ? 'active' : ''}" data-categoria="">
                Todas <span class="category-count">${this.getCategoryCount('')}</span>
            </button>
        `;
        
        this.categorias.forEach(categoria => {
            const btn = document.createElement('button');
            btn.className = `categoria-btn ${this.currentFilter === categoria.nombre ? 'active' : ''}`;
            btn.setAttribute('data-categoria', categoria.nombre);
            
            // Agregar contador de tips
            const count = this.getCategoryCount(categoria.nombre);
            
            // Aplicar estilo de color si existe
            if (categoria.color) {
                if (!btn.classList.contains('active')) {
                    btn.style.backgroundColor = `${categoria.color}40`; // Versión transparente
                    btn.style.borderColor = categoria.color;
                    btn.style.color = this.getContrastColor(categoria.color);
                }
            }
            
            btn.innerHTML = `${categoria.nombre} <span class="category-count">${count}</span>`;
            btn.addEventListener('click', () => this.filterByCategory(categoria.nombre));
            bar.appendChild(btn);
        });
    },
    
    // Obtener el conteo de tips para una categoría
    getCategoryCount(categoria) {
        if (!categoria) {
            return this.allTips.length;
        }
        return this.allTips.filter(tip => tip.categoria === categoria).length;
    },
    
    renderTips() {
        const tipsGrid = document.getElementById('tipsList');
        if (!tipsGrid) return;

        // Paginación
        const totalTips = this.allTips.length;
        const totalPages = Math.ceil(totalTips / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, totalTips);
        const tipsToShow = this.allTips.slice(startIndex, endIndex);

        if (tipsToShow.length === 0) {
            tipsGrid.innerHTML = '<p class="no-results">No se encontraron tips. Crea uno nuevo.</p>';
            return;
        }

        tipsGrid.innerHTML = tipsToShow.map(tip => {
            const categoriaColor = this.getCategoryColor(tip.categoria);
            const color = categoriaColor || '#666';
            
            const esPublico = tip.publico !== false; // Si no está definido, asumir que es público
            const esDestacado = tip.destacado === true;
            
            // Verificar si hay imagen
            const imagenUrl = tip.imagen || (tip.media && tip.media.principal) || '';
            
            return `
                <div class="tip-card ${esDestacado ? 'destacado' : ''}" data-id="${tip.id}">
                    ${imagenUrl ? `
                        <div class="tip-media">
                            <img src="${imagenUrl}" alt="${tip.titulo}" loading="lazy" onerror="this.onerror=null; this.src='../img/logo-trimm-academy.png'; this.style.objectFit='contain'; this.style.backgroundColor='white';">
                        </div>
                    ` : ''}
                    <div class="tip-content">
                        <h3>${tip.titulo || 'Sin título'}</h3>
                        <p>${tip.descripcion || 'Sin descripción'}</p>
                        
                        <div class="tip-categoria" style="background-color: ${color}20; border: 1px solid ${color}; color: ${color};">
                            <span class="categoria-color-indicator" style="background-color: ${color};"></span>
                            ${tip.categoria || 'Sin categoría'}
                        </div>
                        
                        <div class="tip-actions">
                            <button class="action-btn edit-btn" onclick="adminModule.showTipForm('${tip.id}')" title="Editar"></button>
                            <button class="action-btn delete-btn" onclick="adminModule.confirmDeleteTip('${tip.id}')" title="Eliminar"></button>
                            <button class="action-btn highlight-btn ${esDestacado ? 'highlight-on' : 'highlight-off'}" 
                                onclick="adminModule.toggleHighlight('${tip.id}', ${!esDestacado})" 
                                title="${esDestacado ? 'Quitar destacado' : 'Destacar tip'}">
                                ${esDestacado ? '⭐' : '☆'}
                            </button>
                        </div>
                        
                        <div class="publico-badge ${esPublico ? 'visible' : 'hidden'}" title="${esPublico ? 'Publicado' : 'No publicado'}"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Agregar paginación
        this.renderPagination(totalPages);
    },
    
    // Función de utilidad para obtener el color de una categoría
    getCategoryColor(categoria) {
        const cat = this.categorias.find(c => c.nombre === categoria);
        return cat && cat.color ? cat.color : '#666';
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
    
    // Acciones
    filterByCategory(categoria) {
        this.currentFilter = categoria;
        this.renderCategoriesBar();
        this.loadTips();
    },
    
    async handleSearch(query) {
        try {
            if (!query.trim()) {
                // Si la búsqueda está vacía, mostrar todos los tips
                await this.loadTips();
                return;
            }
            
            // Filtrar los tips existentes por el texto de búsqueda
            const queryLower = query.toLowerCase();
            const { db } = window.firebaseService;
            
            // Realizar consulta a Firestore para obtener todos los tips
            let tipsSnapshot;
            if (this.currentFilter) {
                tipsSnapshot = await db.collection('nodos')
                    .where('categoria', '==', this.currentFilter)
                    .get();
            } else {
                tipsSnapshot = await db.collection('nodos').get();
            }
            
            // Filtrar los resultados localmente
            const filteredTips = [];
            
            tipsSnapshot.forEach(doc => {
                const tip = {
                    id: doc.id,
                    ...doc.data()
                };
                
                // Verificar si contiene el texto de búsqueda
                if ((tip.titulo && tip.titulo.toLowerCase().includes(queryLower)) || 
                    (tip.descripcion && tip.descripcion.toLowerCase().includes(queryLower)) ||
                    (tip.contenido && tip.contenido.toLowerCase().includes(queryLower))) {
                    filteredTips.push(tip);
                }
            });
            
            // Actualizar allTips y renderizar
            this.allTips = filteredTips;
            this.renderTips();
            
            // Mostrar mensaje si no hay resultados
            if (filteredTips.length === 0) {
                this.showSuccess(`No se encontraron tips para la búsqueda "${query}"`);
            } else {
                this.showSuccess(`Se encontraron ${filteredTips.length} tips para la búsqueda "${query}"`);
            }
            
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            this.showError('Error al buscar tips: ' + error.message);
            
            // Recargar todos los tips en caso de error
            await this.loadTips();
        }
    },
    
    showTipForm(tipId = null) {
        this.showModal(tipId);
        
        // Si es un nuevo tip, marcar como privado por defecto
        if (!tipId) {
            document.getElementById('publico').checked = false;
        }
    },
    
    async uploadFile(file, path) {
        if (!file) return null;
        
        try {
            this.showSuccess('Subiendo archivo, por favor espera...');
            
            // Comprobar si estamos en modo desarrollo local o producción
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            // Si estamos en entorno local, usar una solución alternativa para evitar problemas CORS
            if (isLocalhost) {
                console.log('Entorno local detectado, utilizando método alternativo de subida...');
                return await this.uploadFileAlternative(file, path);
            }
            
            const { storage, firebase } = window.firebaseService;
            
            // Verificar que el archivo no sea demasiado grande (máximo 5MB)
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
            if (file.size > MAX_FILE_SIZE) {
                this.showError(`El archivo es demasiado grande. El tamaño máximo es 5MB.`);
                return null;
            }
            
            // Crear una referencia única para el archivo
            const timestamp = Date.now();
            const filename = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); // Sanitizar nombre de archivo
            const fileRef = storage.ref(`${path}/${timestamp}_${filename}`);
            
            // Configuración para maximizar compatibilidad
            const metadata = {
                contentType: file.type,
                cacheControl: 'public,max-age=31536000',
                customMetadata: {
                    'origin': window.location.origin
                }
            };
            
            // Crear elemento para mostrar progreso
            const errorContainer = document.getElementById('errorContainer');
            const progressDiv = document.createElement('div');
            progressDiv.className = 'upload-progress';
            progressDiv.innerHTML = `
                <p>Subiendo ${file.name}</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            `;
            errorContainer.appendChild(progressDiv);
            
            console.log('Iniciando subida del archivo:', filename);
            
            // Subir archivo con metadatos
            const uploadTask = fileRef.put(file, metadata);
            
            // Crear una promesa para manejar la subida
            return new Promise((resolve, reject) => {
                // Monitorear progreso
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        const progressBar = progressDiv.querySelector('.progress-bar');
                        progressBar.style.width = progress + '%';
                        progressDiv.querySelector('p').textContent = `Subiendo ${file.name} (${Math.round(progress)}%)`;
                        console.log(`Progreso: ${Math.round(progress)}%`);
                    },
                    (error) => {
                        // Error durante la subida
                        console.error('Error durante la subida:', error);
                        progressDiv.className = 'error-message';
                        progressDiv.innerHTML = `Error al subir ${file.name}: ${error.message}`;
                        
                        // Eliminar mensaje después de 5 segundos
                        setTimeout(() => {
                            if (progressDiv.parentNode) {
                                progressDiv.parentNode.removeChild(progressDiv);
                            }
                        }, 5000);
                        
                        reject(error);
                    },
                    async () => {
                        try {
                            console.log('Subida completada, obteniendo URL de descarga...');
                            // Subida completada exitosamente, obtener URL
                            const downloadURL = await fileRef.getDownloadURL();
                            console.log('URL de descarga obtenida:', downloadURL);
                            
                            // Actualizar mensaje de progreso a éxito
                            progressDiv.className = 'success-message';
                            progressDiv.innerHTML = `Archivo ${file.name} subido correctamente`;
                            
                            // Eliminar mensaje después de 3 segundos
                            setTimeout(() => {
                                if (progressDiv.parentNode) {
                                    progressDiv.parentNode.removeChild(progressDiv);
                                }
                            }, 3000);
                            
                            resolve(downloadURL);
                        } catch (error) {
                            console.error('Error al obtener URL:', error);
                            progressDiv.className = 'error-message';
                            progressDiv.innerHTML = `Error al obtener URL: ${error.message}`;
                            reject(error);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error al subir archivo:', error);
            this.showError(`Error al subir archivo: ${error.message}`);
            return null;
        }
    },
    
    // Método alternativo de subida para evitar CORS
    async uploadFileAlternative(file, path) {
        try {
            this.showSuccess('Usando método alternativo de subida...');
            
            // Convertir a Base64 para evitar CORS
            const base64 = await this.getBase64(file);
            const { db, firebase } = window.firebaseService;
            
            // Guardar referencia en Firestore
            const timestamp = Date.now();
            const filename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            
            const fileData = {
                filename: filename,
                path: path,
                contentType: file.type,
                uploadDate: firebase.firestore.Timestamp.now(),
                base64Data: base64
            };
            
            // Guardar en Firestore (colección temporal)
            const fileRef = await db.collection('tempFiles').add(fileData);
            
            // Usar URL de Firestore como referencia
            const fileUrl = `https://firebasestorage.googleapis.com/v0/b/riggingtips.appspot.com/o/${path}%2F${timestamp}_${encodeURIComponent(filename)}?alt=media`;
            
            this.showSuccess('Archivo procesado correctamente de manera alternativa');
            
            return fileUrl;
        } catch (error) {
            console.error('Error en método alternativo de subida:', error);
            this.showError(`Error al procesar archivo: ${error.message}`);
            return null;
        }
    },
    
    // Convertir archivo a Base64
    getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },
    
    async saveTip(event) {
        event.preventDefault();
        
        try {
            // Deshabilitar el botón de guardar para evitar múltiples envíos
            const submitButton = event.target.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Guardando...';
            }
            
            const { db, firebase } = window.firebaseService;
            const form = event.target;
            const tipId = form.dataset.tipId;
            
            // Recolectar datos básicos del formulario
            const isPublico = document.getElementById('publico').checked;
            console.log('Valor de checkbox publico:', isPublico);
            
            const tipData = {
                titulo: form.titulo.value.trim(),
                descripcion: form.descripcion.value.trim(),
                categoria: form.categoria.value,
                contenido: form.contenido.value.trim(),
                publico: isPublico, // Usar directamente el valor del checkbox
                actualizado: firebase.firestore.Timestamp.now()
            };
            
            // Validar datos mínimos
            if (!tipData.titulo) {
                this.showError('El título no puede estar vacío');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Guardar';
                }
                return;
            }
            
            if (!tipData.descripcion) {
                this.showError('La descripción no puede estar vacía');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Guardar';
                }
                return;
            }
            
            console.log('Procesando archivos...');
            
            // Subir archivos si existen
            const imagenFile = document.getElementById('imagenFile').files[0];
            const videoFile = document.getElementById('videoFile').files[0];
            
            // Obtener URL existente o input de texto con URL
            let imagenURL = form.imagen.value.trim();
            let videoURL = form.video.value.trim();
            
            // Si hay archivos seleccionados, subirlos
            if (imagenFile) {
                console.log('Subiendo imagen:', imagenFile.name);
                this.showSuccess('Procesando imagen...');
                try {
                    const uploadedImageUrl = await this.uploadFile(imagenFile, 'imagenes');
                    
                    if (uploadedImageUrl) {
                        console.log('Imagen subida correctamente:', uploadedImageUrl);
                        imagenURL = uploadedImageUrl;
                        this.showSuccess('Imagen subida correctamente');
                    } else {
                        console.error('No se pudo obtener URL de la imagen');
                        this.showError('Error al subir la imagen. Se utilizará la URL existente si está disponible.');
                    }
                } catch (error) {
                    console.error('Error al subir imagen:', error);
                    this.showError(`Error al subir imagen: ${error.message}`);
                }
            }
            
            if (videoFile) {
                console.log('Subiendo video:', videoFile.name);
                this.showSuccess('Procesando video...');
                try {
                    const uploadedVideoUrl = await this.uploadFile(videoFile, 'videos');
                    
                    if (uploadedVideoUrl) {
                        console.log('Video subido correctamente:', uploadedVideoUrl);
                        videoURL = uploadedVideoUrl;
                        this.showSuccess('Video subido correctamente');
                    } else {
                        console.error('No se pudo obtener URL del video');
                        this.showError('Error al subir el video. Se utilizará la URL existente si está disponible.');
                    }
                } catch (error) {
                    console.error('Error al subir video:', error);
                    this.showError(`Error al subir video: ${error.message}`);
                }
            }
            
            // Asignar URLs a los datos del tip
            tipData.imagen = imagenURL;
            tipData.video = videoURL;
            
            this.showSuccess('Guardando tip...');
            console.log('Guardando tip:', tipData);
            
            if (tipId) {
                // Actualizar tip existente
                await db.collection('nodos').doc(tipId).update(tipData);
                this.showSuccess('Tip actualizado correctamente');
            } else {
                // Crear nuevo tip
                tipData.creado = firebase.firestore.Timestamp.now();
                if (this.user && this.user.email) {
                    tipData.autorEmail = this.user.email; // Añadir email del autor
                }
                await db.collection('nodos').add(tipData);
                this.showSuccess('Tip creado correctamente');
            }
            
            // Recargar tips y cerrar modal
            this.hideModal();
            await this.loadTips();
        } catch (error) {
            console.error('Error al guardar tip:', error);
            this.showError('Error al guardar el tip: ' + error.message);
        } finally {
            // Restaurar el estado del botón
            const submitButton = event.target.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar';
            }
        }
    },
    
    async confirmDeleteTip(tipId) {
        if (confirm('¿Estás seguro de que quieres eliminar este tip?')) {
            try {
                const { db } = window.firebaseService;
                await db.collection('nodos').doc(tipId).delete();
                this.showSuccess('Tip eliminado correctamente');
                await this.loadTips();
            } catch (error) {
                console.error('Error al eliminar tip:', error);
                this.showError('Error al eliminar el tip: ' + error.message);
            }
        }
    },
    
    async resetDatabase() {
        try {
            // Primero creamos un respaldo de la base de datos actual
            this.hideConfirmModal();
            this.showSuccess('Preparando respaldo local de la base de datos...');
            
            const { db } = window.firebaseService;
            
            // 1. Obtener todas las categorías
            const categoriasSnapshot = await db.collection('categorias').get();
            const categorias = categoriasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            if (categorias.length === 0) {
                this.showSuccess('No hay categorías para respaldar.');
            } else {
                this.showSuccess(`Se respaldarán ${categorias.length} categorías.`);
            }
            
            // 2. Obtener todos los nodos
            const nodosSnapshot = await db.collection('nodos').get();
            const nodos = nodosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            if (nodos.length === 0) {
                this.showSuccess('No hay nodos para respaldar.');
            } else {
                this.showSuccess(`Se respaldarán ${nodos.length} nodos.`);
            }
            
            // 3. Organizar nodos por categoría
            const nodosPorCategoria = {};
            categorias.forEach(cat => {
                if (cat && cat.nombre) {
                    nodosPorCategoria[cat.nombre] = [];
                }
            });
            
            // Añadir cada nodo a su categoría correspondiente
            nodos.forEach(nodo => {
                const categoria = nodo.categoria;
                if (nodosPorCategoria[categoria]) {
                    nodosPorCategoria[categoria].push(nodo);
                } else {
                    // Si la categoría no existe, crear un array para ella
                    nodosPorCategoria[categoria] = [nodo];
                }
            });
            
            // 4. Crear el objeto de backup completo
            const backup = {
                fecha: new Date().toISOString(),
                categorias,
                nodos,
                nodosPorCategoria,
                metadata: {
                    totalCategorias: categorias.length,
                    totalNodos: nodos.length,
                    version: "1.0"
                }
            };
            
            // 5. Convertir a JSON y descargar
            const backupJSON = JSON.stringify(backup, null, 2);
            const blob = new Blob([backupJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const filename = `riggingtips_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            
            // Crear enlace invisible y hacer clic en él para descargar
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Mostrar mensaje de éxito
            this.showSuccess(`Respaldo creado con éxito como "${filename}"`);
            
            // Preguntar al usuario si desea continuar
            if (confirm('El respaldo se ha descargado correctamente. ¿Deseas continuar con el reinicio de la base de datos?')) {
                this.showSuccess('Iniciando reinicio de la base de datos. La página se recargará automáticamente.');
                
                // Disparamos evento personalizado para que lo capture el script de database-seed.js
                const event = new CustomEvent('reset-database');
                document.dispatchEvent(event);
            } else {
                this.showSuccess('Operación de reinicio cancelada por el usuario.');
            }
        } catch (error) {
            console.error('Error al realizar respaldo de la base de datos:', error);
            this.showError(`Error al respaldar la base de datos: ${error.message}`);
            
            // Preguntar si quiere continuar a pesar del error
            if (confirm('Ocurrió un error al crear el respaldo. ¿Deseas continuar con el reinicio de la base de datos de todas formas?')) {
                this.showSuccess('Iniciando reinicio de la base de datos sin respaldo. La página se recargará automáticamente.');
                const event = new CustomEvent('reset-database');
                document.dispatchEvent(event);
            } else {
                this.showSuccess('Operación de reinicio cancelada por el usuario.');
            }
        }
    },
    
    async toggleStoredImagesPreview() {
        const previewContainer = document.getElementById('storedImagesPreview');
        const isVisible = !previewContainer.classList.contains('hidden');
        
        if (isVisible) {
            previewContainer.classList.add('hidden');
            return;
        }
        
        previewContainer.classList.remove('hidden');
        const imageGrid = document.getElementById('imageGrid');
        imageGrid.innerHTML = '<p>Cargando imágenes...</p>';
        
        try {
            // Utilizamos directamente Firestore para obtener los URLs de las imágenes
            // en lugar de intentar listar el Storage (evita problemas de CORS)
            const { db } = window.firebaseService;
            const nodosSnapshot = await db.collection('nodos').get();
            
            // Obtenemos todas las URLs únicas de imágenes usadas en los nodos
            const imageUrls = new Set();
            
            nodosSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.imagen && typeof data.imagen === 'string' && data.imagen.startsWith('http')) {
                    imageUrls.add(data.imagen);
                }
            });
            
            if (imageUrls.size === 0) {
                imageGrid.innerHTML = '<p>No hay imágenes disponibles</p>';
                return;
            }
            
            imageGrid.innerHTML = '';
            
            // Crear elementos para cada imagen
            Array.from(imageUrls).forEach(url => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                
                // Extraer nombre del archivo de la URL
                const filename = url.split('/').pop().split('?')[0];
                const displayName = filename.length > 15 ? filename.substring(0, 12) + '...' : filename;
                
                imageItem.innerHTML = `
                    <img src="${url}" alt="${displayName}" onerror="this.src='https://placehold.co/100x100?text=Error'">
                    <span class="image-name">${displayName}</span>
                `;
                
                imageItem.addEventListener('click', () => {
                    // Seleccionar esta imagen
                    document.querySelectorAll('.image-item').forEach(item => item.classList.remove('selected'));
                    imageItem.classList.add('selected');
                    document.getElementById('imagen').value = url;
                    // Mostrar vista previa
                    this.previewImageFromUrl(url);
                    // Cerrar el preview después de un breve retraso
                    setTimeout(() => {
                        previewContainer.classList.add('hidden');
                    }, 500);
                });
                
                imageGrid.appendChild(imageItem);
            });
            
        } catch (error) {
            console.error('Error al cargar imágenes:', error);
            imageGrid.innerHTML = `<p>Error al cargar imágenes: ${error.message}</p>`;
        }
    },
    
    async toggleStoredVideosPreview() {
        const previewContainer = document.getElementById('storedVideosPreview');
        const isVisible = !previewContainer.classList.contains('hidden');
        
        if (isVisible) {
            previewContainer.classList.add('hidden');
            return;
        }
        
        previewContainer.classList.remove('hidden');
        const videoGrid = document.getElementById('videoGrid');
        videoGrid.innerHTML = '<p>Cargando videos...</p>';
        
        try {
            // Utilizamos directamente Firestore para obtener los URLs de los videos
            const { db } = window.firebaseService;
            const nodosSnapshot = await db.collection('nodos').get();
            
            // Obtenemos todas las URLs únicas de videos usadas en los nodos
            const videoUrls = new Set();
            
            nodosSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.video && typeof data.video === 'string' && data.video.startsWith('http')) {
                    videoUrls.add(data.video);
                }
            });
            
            if (videoUrls.size === 0) {
                videoGrid.innerHTML = '<p>No hay videos disponibles</p>';
                return;
            }
            
            videoGrid.innerHTML = '';
            
            // Crear elementos para cada video
            Array.from(videoUrls).forEach(url => {
                const videoItem = document.createElement('div');
                videoItem.className = 'image-item';
                
                // Extraer nombre del archivo de la URL
                const filename = url.split('/').pop().split('?')[0];
                const displayName = filename.length > 15 ? filename.substring(0, 12) + '...' : filename;
                
                videoItem.innerHTML = `
                    <div class="video-preview">
                        <span class="play-icon">▶️</span>
                    </div>
                    <span class="image-name">${displayName}</span>
                `;
                
                videoItem.addEventListener('click', () => {
                    // Seleccionar este video
                    document.querySelectorAll('.image-item').forEach(item => item.classList.remove('selected'));
                    videoItem.classList.add('selected');
                    document.getElementById('video').value = url;
                    // Cerrar el preview después de un breve retraso
                    setTimeout(() => {
                        previewContainer.classList.add('hidden');
                    }, 500);
                });
                
                videoGrid.appendChild(videoItem);
            });
            
        } catch (error) {
            console.error('Error al cargar videos:', error);
            videoGrid.innerHTML = `<p>Error al cargar videos: ${error.message}</p>`;
        }
    },
    
    // Métodos para preview de imágenes
    previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = `
                    <div class="preview-container">
                        <img src="${e.target.result}" alt="Vista previa">
                        <button type="button" class="remove-preview" onclick="adminModule.removeImagePreview()">×</button>
                    </div>
                    <p class="preview-filename">${input.files[0].name}</p>
                `;
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    },
    
    previewImageFromUrl(url) {
        if (!url) {
            this.removeImagePreview();
            return;
        }
        
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = `
            <div class="preview-container">
                <img src="${url}" alt="Vista previa" onerror="this.onerror=null; this.src='../img/logo-trimm-academy.png'; this.style.objectFit='contain'; this.style.backgroundColor='white';">
                <button type="button" class="remove-preview" onclick="adminModule.removeImagePreview()">×</button>
            </div>
            <p class="preview-filename">URL: ${url.substring(0, 40)}${url.length > 40 ? '...' : ''}</p>
        `;
    },
    
    removeImagePreview() {
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = '';
        // Limpiar los inputs
        document.getElementById('imagenFile').value = '';
        document.getElementById('imagen').value = '';
    },
    
    // Funciones para gestión de categorías
    showCategoriesModal() {
        document.getElementById('categoriesModal').classList.remove('hidden');
        this.renderCategoriesList();
        this.initColorPresets();
    },
    
    initColorPresets() {
        // Configurar eventos para los presets de colores
        document.querySelectorAll('.color-preset').forEach(preset => {
            // Limpiar eventos previos para evitar duplicados
            const newPreset = preset.cloneNode(true);
            preset.parentNode.replaceChild(newPreset, preset);
            
            newPreset.addEventListener('click', () => {
                // Seleccionar visualmente
                document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
                newPreset.classList.add('selected');
                
                // Actualizar el input de color
                const color = newPreset.getAttribute('data-color');
                document.getElementById('categoryColor').value = color;
            });
        });
    },
    
    hideCategoriesModal() {
        document.getElementById('categoriesModal').classList.add('hidden');
    },
    
    async renderCategoriesList() {
        try {
            const categoriesList = document.getElementById('categoriesList');
            categoriesList.innerHTML = '<li>Cargando categorías...</li>';
            
            if (!this.categorias || this.categorias.length === 0) {
                categoriesList.innerHTML = '<li class="empty-list-message">No hay categorías disponibles</li>';
                return;
            }
            
            categoriesList.innerHTML = '';
            
            this.categorias.forEach(categoria => {
                if (categoria && categoria.nombre) {
                    const li = document.createElement('li');
                    const categoryColor = categoria.color || '#4caf50'; // Color por defecto si no existe
                    
                    li.innerHTML = `
                        <div class="category-info">
                            <span class="category-color-indicator" style="background-color: ${categoryColor}"></span>
                            <span>${categoria.nombre}</span>
                        </div>
                        <div class="category-actions">
                            <button type="button" class="action-btn edit-btn" title="Editar categoría"></button>
                            <button type="button" class="category-delete-btn" title="Eliminar categoría">🗑️</button>
                        </div>
                    `;
                    
                    // Agregar evento para editar categoría
                    li.querySelector('.edit-btn').addEventListener('click', () => {
                        this.editCategory(categoria.id, categoria.nombre, categoryColor);
                    });
                    
                    // Agregar evento para eliminar categoría
                    li.querySelector('.category-delete-btn').addEventListener('click', () => {
                        this.deleteCategory(categoria.id, categoria.nombre);
                    });
                    
                    categoriesList.appendChild(li);
                }
            });
        } catch (error) {
            console.error('Error al renderizar lista de categorías:', error);
            this.showError('Error al mostrar categorías: ' + error.message);
        }
    },
    
    async addCategory(event) {
        event.preventDefault();
        
        try {
            const categoryName = document.getElementById('categoryName').value.trim();
            const categoryColor = document.getElementById('categoryColor').value.trim();
            
            if (!categoryName) {
                this.showError('El nombre de la categoría no puede estar vacío');
                return;
            }
            
            // Verificar si ya existe una categoría con ese nombre
            const existingCategory = this.categorias.find(cat => 
                cat.nombre && cat.nombre.toLowerCase() === categoryName.toLowerCase()
            );
            
            if (existingCategory) {
                this.showError('Ya existe una categoría con ese nombre');
                return;
            }
            
            const { db, firebase } = window.firebaseService;
            
            // Crear nueva categoría con color
            await db.collection('categorias').add({
                nombre: categoryName,
                color: categoryColor,
                creado: firebase.firestore.Timestamp.now()
            });
            
            this.showSuccess(`Categoría "${categoryName}" creada correctamente`);
            
            // Limpiar formulario
            document.getElementById('categoryName').value = '';
            document.getElementById('categoryColor').value = '#4caf50';
            document.querySelectorAll('.color-preset').forEach(preset => preset.classList.remove('selected'));
            
            // Recargar categorías
            await this.loadCategorias();
            
            // Actualizar lista de categorías
            this.renderCategoriesList();
            
        } catch (error) {
            console.error('Error al crear categoría:', error);
            this.showError('Error al crear categoría: ' + error.message);
        }
    },
    
    async editCategory(categoryId, categoryName, categoryColor) {
        try {
            // Cambiar formulario para edición
            document.getElementById('categoryName').value = categoryName;
            document.getElementById('categoryColor').value = categoryColor || '#4caf50';
            
            // Seleccionar visualmente el preset que coincida con el color, si existe
            document.querySelectorAll('.color-preset').forEach(preset => {
                const presetColor = preset.getAttribute('data-color');
                if (presetColor === categoryColor) {
                    preset.classList.add('selected');
                } else {
                    preset.classList.remove('selected');
                }
            });
            
            // Cambiar texto del botón
            const submitButton = document.getElementById('categoryForm').querySelector('button[type="submit"]');
            submitButton.textContent = 'Actualizar Categoría';
            
            // Guardar ID para actualizar
            document.getElementById('categoryForm').dataset.editId = categoryId;
            // Guardar nombre original para comparar
            document.getElementById('categoryForm').dataset.originalName = categoryName;
            
            // Cambiar acción del formulario
            const form = document.getElementById('categoryForm');
            const originalSubmit = form.onsubmit;
            
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                const newName = document.getElementById('categoryName').value.trim();
                const newColor = document.getElementById('categoryColor').value.trim();
                const originalName = form.dataset.originalName;
                
                if (!newName) {
                    this.showError('El nombre de la categoría no puede estar vacío');
                    return;
                }
                
                try {
                    // Solo verificar duplicados si el nombre ha cambiado
                    if (newName.toLowerCase() !== originalName.toLowerCase()) {
                        // Verificar si ya existe una categoría con ese nombre
                        const existingCategory = this.categorias.find(cat => 
                            cat.nombre && cat.nombre.toLowerCase() === newName.toLowerCase() && cat.id !== categoryId
                        );
                        
                        if (existingCategory) {
                            this.showError('Ya existe una categoría con ese nombre');
                            return;
                        }
                    }
                    
                    const { db } = window.firebaseService;
                    
                    // Actualizar categoría
                    await db.collection('categorias').doc(categoryId).update({
                        nombre: newName,
                        color: newColor
                    });
                    
                    this.showSuccess(`Categoría actualizada correctamente`);
                    
                    // Limpiar formulario
                    document.getElementById('categoryName').value = '';
                    document.getElementById('categoryColor').value = '#4caf50';
                    document.querySelectorAll('.color-preset').forEach(preset => preset.classList.remove('selected'));
                    delete form.dataset.editId;
                    delete form.dataset.originalName;
                    
                    // Restaurar acción original
                    submitButton.textContent = 'Agregar Categoría';
                    form.onsubmit = originalSubmit;
                    
                    // Recargar categorías
                    await this.loadCategorias();
                    
                    // Actualizar lista de categorías
                    this.renderCategoriesList();
                } catch (error) {
                    console.error('Error al actualizar categoría:', error);
                    this.showError('Error al actualizar categoría: ' + error.message);
                }
            };
        } catch (error) {
            console.error('Error al preparar edición de categoría:', error);
            this.showError('Error al preparar edición: ' + error.message);
        }
    },
    
    async deleteCategory(categoryId, categoryName) {
        if (!categoryId) {
            this.showError('ID de categoría no válido');
            return;
        }
        
        try {
            // Verificar si hay nodos usando esta categoría
            const { db } = window.firebaseService;
            const nodosSnapshot = await db.collection('nodos')
                .where('categoria', '==', categoryName)
                .get();
            
            if (!nodosSnapshot.empty) {
                if (!confirm(`Hay ${nodosSnapshot.size} tips usando esta categoría. ¿Estás seguro de querer eliminarla? Los tips conservarán el nombre de la categoría aunque esta se elimine.`)) {
                    return;
                }
            } else {
                if (!confirm(`¿Estás seguro de querer eliminar la categoría "${categoryName}"?`)) {
                    return;
                }
            }
            
            // Eliminar categoría
            await db.collection('categorias').doc(categoryId).delete();
            
            this.showSuccess(`Categoría "${categoryName}" eliminada correctamente`);
            
            // Recargar categorías
            await this.loadCategorias();
            
            // Actualizar lista de categorías
            this.renderCategoriesList();
            
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            this.showError('Error al eliminar categoría: ' + error.message);
        }
    },
    
    async toggleHighlight(tipId, destacado) {
        try {
            console.log(`Cambiando estado destacado de tip ${tipId} a ${destacado}`);
            const { db, firebase } = window.firebaseService;
            const tipRef = db.collection('nodos').doc(tipId);
            
            // Verificar si existe antes de actualizar
            const doc = await tipRef.get();
            if (!doc.exists) {
                console.error(`El documento ${tipId} no existe`);
                this.showError(`No se pudo destacar el elemento. El documento no existe.`);
                return;
            }
            
            // Actualizar el campo destacado directamente
            await tipRef.update({
                destacado: !!destacado, // Asegurar que sea booleano
                actualizado: firebase.firestore.Timestamp.now() // Actualizar timestamp
            });
            
            console.log(`Tip ${tipId} actualizado correctamente`);
            
            // Actualizar la UI
            this.showSuccess(`Tip ${destacado ? 'destacado' : 'quitado de destacados'} correctamente`);
            
            // Recargar los tips para mostrar cambios
            await this.loadTips();
        } catch (error) {
            console.error('Error al cambiar estado destacado:', error);
            this.showError('Error al cambiar estado destacado: ' + error.message);
        }
    },
    
    renderPagination(totalPages) {
        const tipsGrid = document.getElementById('tipsList');
        if (!tipsGrid) return;
        
        // Si no hay más de una página, no mostrar paginación
        if (totalPages <= 1) return;
        
        // Crear el elemento de paginación
        const paginationEl = document.createElement('div');
        paginationEl.className = 'pagination-controls';
        
        // Información de paginación
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.allTips.length);
        
        paginationEl.innerHTML = `
            <div class="pagination-info">
                Mostrando ${startIndex + 1}-${endIndex} de ${this.allTips.length} tips
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
        
        // Añadir la paginación después de la lista de tips
        const existingPagination = document.querySelector('.pagination-controls');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        tipsGrid.parentNode.insertBefore(paginationEl, tipsGrid.nextSibling);
        
        // Event listeners para paginación
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTips();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        document.getElementById('nextPage')?.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTips();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    },
};

// Inicializar módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => adminModule.init());

// Exportar el módulo para su uso en otros archivos
export default adminModule; 