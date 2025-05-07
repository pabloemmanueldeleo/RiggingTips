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
    
    // Inicialización
    async init() {
        // Esperar a que Firebase esté inicializado
        if (!window.firebaseService) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        console.log('Inicializando panel de administración...');
        
        // Referencias a servicios de Firebase
        const { auth, db } = window.firebaseService;
        
        // Definir funciones globales para vista previa de imágenes
        window.previewImage = (input) => this.previewImage(input);
        window.previewImageFromUrl = (url) => this.previewImageFromUrl(url);
        window.removeImagePreview = () => this.removeImagePreview();
        
        // Añadir listeners a botones
        document.getElementById('loginButton').addEventListener('click', () => this.login());
        document.getElementById('logoutButton').addEventListener('click', () => this.logout());
        document.getElementById('newTipButton').addEventListener('click', () => this.showTipForm());
        document.getElementById('closeModalButton').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelButton').addEventListener('click', () => this.hideModal());
        document.getElementById('tipForm').addEventListener('submit', (e) => this.saveTip(e));
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Botones para gestión de categorías
        document.getElementById('manageCategoriesButton').addEventListener('click', () => this.showCategoriesModal());
        document.getElementById('closeCategoriesModalButton').addEventListener('click', () => this.hideCategoriesModal());
        document.getElementById('categoryForm').addEventListener('submit', (e) => this.addCategory(e));
        
        // Botones para reinicio de base de datos
        document.getElementById('resetDatabaseButton').addEventListener('click', () => this.showConfirmReset());
        document.getElementById('cancelResetButton').addEventListener('click', () => this.hideConfirmModal());
        document.getElementById('confirmResetButton').addEventListener('click', () => this.resetDatabase());
        
        // Botones para explorar imágenes/videos en Storage
        document.getElementById('browseStorageBtn').addEventListener('click', () => this.toggleStoredImagesPreview());
        document.getElementById('browseVideosBtn').addEventListener('click', () => this.toggleStoredVideosPreview());
        
        // Comprobar autenticación
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
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorContainer.appendChild(errorDiv);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    },
    
    showSuccess(message) {
        const errorContainer = document.getElementById('errorContainer');
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        errorContainer.appendChild(successDiv);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
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
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                console.log('No se encontraron tips que coincidan con el filtro actual');
            }
            
            this.allTips = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('Tips cargados:', this.allTips.length);
            this.renderTips();
            
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
                Todas
            </button>
        `;
        
        this.categorias.forEach(categoria => {
            const btn = document.createElement('button');
            btn.className = `categoria-btn ${this.currentFilter === categoria.nombre ? 'active' : ''}`;
            btn.setAttribute('data-categoria', categoria.nombre);
            btn.textContent = categoria.nombre;
            btn.addEventListener('click', () => this.filterByCategory(categoria.nombre));
            bar.appendChild(btn);
        });
    },
    
    renderTips() {
        const container = document.getElementById('tipsList');
        container.innerHTML = '';
        
        if (this.allTips.length === 0) {
            container.innerHTML = '<div class="no-results">No se encontraron tips</div>';
            return;
        }
        
        this.allTips.forEach(tip => {
            const card = document.createElement('div');
            card.className = 'tip-card';
            
            // Determinar si hay imagen
            let mediaHTML = '';
            if (tip.imagen) {
                mediaHTML = `
                    <div class="tip-media">
                        <img src="${tip.imagen}" alt="${tip.titulo}" onerror="this.src='https://placehold.co/600x400?text=Imagen+no+disponible'">
                        ${tip.video ? '<div class="video-indicator">▶️</div>' : ''}
                    </div>
                `;
            }
            
            card.innerHTML = `
                <div class="publico-badge ${tip.publico !== false ? 'visible' : 'hidden'}"></div>
                ${mediaHTML}
                <div class="tip-content">
                    <h3>${tip.titulo || 'Sin título'}</h3>
                    <p>${tip.descripcion || 'Sin descripción'}</p>
                </div>
                <div class="tip-footer">
                    <span class="tip-categoria">${tip.categoria || 'Sin categoría'}</span>
                    <div class="tip-actions">
                        <button class="action-btn edit-btn" title="Editar"></button>
                        <button class="action-btn delete-btn" title="Eliminar"></button>
                    </div>
                </div>
            `;
            
            // Añadir event listeners
            card.querySelector('.edit-btn').addEventListener('click', () => this.showTipForm(tip.id));
            card.querySelector('.delete-btn').addEventListener('click', () => this.confirmDeleteTip(tip.id));
            
            container.appendChild(card);
        });
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
    },
    
    async uploadFile(file, path) {
        if (!file) return null;
        
        try {
            this.showSuccess('Subiendo archivo, por favor espera...');
            
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
            
            // Subir archivo con metadatos
            const uploadTask = fileRef.put(file, metadata);
            
            // Crear una promesa para manejar la subida
            const uploadPromise = new Promise((resolve, reject) => {
                // Monitorear progreso
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        const progressBar = progressDiv.querySelector('.progress-bar');
                        progressBar.style.width = progress + '%';
                        progressDiv.querySelector('p').textContent = `Subiendo ${file.name} (${Math.round(progress)}%)`;
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
                            // Subida completada exitosamente
                            const downloadURL = await fileRef.getDownloadURL();
                            
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
                            reject(error);
                        }
                    }
                );
            });
            
            // Esperar a que termine la subida
            const downloadURL = await uploadPromise;
            console.log('Archivo subido correctamente:', downloadURL);
            return downloadURL;
            
        } catch (error) {
            console.error('Error al subir archivo:', error);
            this.showError(`Error al subir archivo: ${error.message}`);
            return null;
        }
    },
    
    async saveTip(event) {
        event.preventDefault();
        
        try {
            const { db, firebase } = window.firebaseService;
            const form = event.target;
            const tipId = form.dataset.tipId;
            
            // Recolectar datos básicos del formulario
            const tipData = {
                titulo: form.titulo.value.trim(),
                descripcion: form.descripcion.value.trim(),
                categoria: form.categoria.value,
                contenido: form.contenido.value.trim(),
                publico: form.publico.checked,
                actualizado: firebase.firestore.Timestamp.now()
            };
            
            // Validar datos mínimos
            if (!tipData.titulo) {
                this.showError('El título no puede estar vacío');
                return;
            }
            
            if (!tipData.descripcion) {
                this.showError('La descripción no puede estar vacía');
                return;
            }
            
            // Subir archivos si existen
            const imagenFile = document.getElementById('imagenFile').files[0];
            const videoFile = document.getElementById('videoFile').files[0];
            
            // Obtener URL existente o input de texto con URL
            let imagenURL = form.imagen.value.trim();
            let videoURL = form.video.value.trim();
            
            // Si hay archivos seleccionados, subirlos
            if (imagenFile) {
                this.showSuccess('Procesando imagen...');
                const uploadedImageUrl = await this.uploadFile(imagenFile, 'imagenes');
                
                if (uploadedImageUrl) {
                    imagenURL = uploadedImageUrl;
                    this.showSuccess('Imagen subida correctamente');
                } else {
                    this.showError('Error al subir la imagen. Se utilizará la URL existente si está disponible.');
                }
            }
            
            if (videoFile) {
                this.showSuccess('Procesando video...');
                const uploadedVideoUrl = await this.uploadFile(videoFile, 'videos');
                
                if (uploadedVideoUrl) {
                    videoURL = uploadedVideoUrl;
                    this.showSuccess('Video subido correctamente');
                } else {
                    this.showError('Error al subir el video. Se utilizará la URL existente si está disponible.');
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
                await db.collection('nodos').add(tipData);
                this.showSuccess('Tip creado correctamente');
            }
            
            // Recargar tips y cerrar modal
            this.hideModal();
            await this.loadTips();
        } catch (error) {
            console.error('Error al guardar tip:', error);
            this.showError('Error al guardar el tip: ' + error.message);
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
                        <button type="button" class="remove-preview" onclick="removeImagePreview()">×</button>
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
                <img src="${url}" alt="Vista previa" onerror="this.src='https://placehold.co/600x400?text=Error+de+imagen'">
                <button type="button" class="remove-preview" onclick="removeImagePreview()">×</button>
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
                    li.innerHTML = `
                        <span>${categoria.nombre}</span>
                        <div class="category-actions">
                            <button type="button" class="category-delete-btn" title="Eliminar categoría">🗑️</button>
                        </div>
                    `;
                    
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
            
            // Crear nueva categoría
            await db.collection('categorias').add({
                nombre: categoryName,
                creado: firebase.firestore.Timestamp.now()
            });
            
            this.showSuccess(`Categoría "${categoryName}" creada correctamente`);
            
            // Limpiar formulario
            document.getElementById('categoryName').value = '';
            
            // Recargar categorías
            await this.loadCategorias();
            
            // Actualizar lista de categorías
            this.renderCategoriesList();
            
        } catch (error) {
            console.error('Error al crear categoría:', error);
            this.showError('Error al crear categoría: ' + error.message);
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
};

// Inicializar módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => adminModule.init()); 