// Operaciones CRUD para el panel de administración - Acceso directo
console.log('[ADMIN_CRUD] Inicializando módulo CRUD directo');

// Variable para almacenar categorías
let categorias = [];
let tips = [];

// Variable para referencia a Firestore
let db = null;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('[ADMIN_CRUD] DOM cargado, esperando Firebase...');
    
    // Esperar a que Firebase esté listo
    if (window.firebaseService && window.firebaseService.initialized) {
        initCrud();
    } else {
        document.addEventListener('firebaseServiceReady', initCrud);
    }
    
    // Escuchar evento de datos cargados
    document.addEventListener('adminDataReady', () => {
        console.log('[ADMIN_CRUD] Datos listos, renderizando...');
        loadCategorias();
        loadTips();
    });
});

// Inicializar CRUD
function initCrud() {
    console.log('[ADMIN_CRUD] Inicializando CRUD con Firebase');
    
    // Obtener referencia a Firestore
    db = window.firebaseService.db;
    
    // Cargar datos
    loadCategorias();
    
    // Configurar eventos para los botones principales
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    console.log('[ADMIN_CRUD] Configurando event listeners');
    
    // Botón para nuevo tip
    document.getElementById('newTipButton')?.addEventListener('click', () => {
        console.log('[ADMIN_CRUD] Botón nuevo tip clickeado');
        showTipModal();
    });
    
    // Botón para gestionar categorías
    document.getElementById('manageCategoriesButton')?.addEventListener('click', () => {
        console.log('[ADMIN_CRUD] Botón gestionar categorías clickeado');
        showCategoriesModal();
    });
    
    // Formulario de tip
    document.getElementById('tipForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTip();
    });
    
    // Formulario de categoría
    document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCategory();
    });
    
    // Botones para cerrar modales
    document.getElementById('closeModalButton')?.addEventListener('click', () => {
        document.getElementById('tipModal').classList.add('hidden');
    });
    
    document.getElementById('closeCategoriesModalButton')?.addEventListener('click', () => {
        document.getElementById('categoriesModal').classList.add('hidden');
    });
    
    // Configurar búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.trim() === '') {
                renderTips(tips);
            } else {
                const filtered = tips.filter(tip => 
                    (tip.titulo && tip.titulo.toLowerCase().includes(query)) ||
                    (tip.descripcion && tip.descripcion.toLowerCase().includes(query))
                );
                renderTips(filtered);
            }
        });
    }
}

// Cargar categorías
async function loadCategorias() {
    try {
        console.log('[ADMIN_CRUD] Cargando categorías...');
        
        if (!db) {
            console.error('[ADMIN_CRUD] Firestore no está inicializado');
            return;
        }
        
        const snapshot = await db.collection('categorias').get();
        categorias = [];
        
        snapshot.forEach(doc => {
            categorias.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('[ADMIN_CRUD] Categorías cargadas:', categorias.length);
        
        // Actualizar selector de categorías
        updateCategorySelect();
        
        // Renderizar barra de categorías
        renderCategoriesBar();
        
        // Cargar tips ahora que ya tenemos categorías
        loadTips();
        
    } catch (error) {
        console.error('[ADMIN_CRUD] Error al cargar categorías:', error);
        showMessage('Error al cargar categorías: ' + error.message, 'error');
    }
}

// Actualizar selector de categorías para el formulario
function updateCategorySelect() {
    const select = document.getElementById('categoria');
    if (!select) return;
    
    select.innerHTML = '';
    
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.nombre;
        option.textContent = cat.nombre;
        select.appendChild(option);
    });
}

// Renderizar barra de categorías
function renderCategoriesBar() {
    const bar = document.getElementById('categoriasBar');
    if (!bar) return;
    
    let html = `
        <button class="categoria-btn active" data-categoria="">
            Todas <span class="category-count">${tips.length}</span>
        </button>
    `;
    
    categorias.forEach(cat => {
        const count = tips.filter(tip => tip.categoria === cat.nombre).length;
        html += `
            <button class="categoria-btn" data-categoria="${cat.nombre}">
                ${cat.nombre} <span class="category-count">${count}</span>
            </button>
        `;
    });
    
    bar.innerHTML = html;
    
    // Añadir eventos a los botones de categoría
    bar.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const categoria = btn.dataset.categoria;
            
            // Actualizar selección visual
            bar.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filtrar tips
            if (categoria) {
                const filtered = tips.filter(tip => tip.categoria === categoria);
                renderTips(filtered);
            } else {
                renderTips(tips);
            }
        });
    });
}

// Cargar tips
async function loadTips() {
    try {
        console.log('[ADMIN_CRUD] Cargando tips...');
        
        if (!db) {
            console.error('[ADMIN_CRUD] Firestore no está inicializado');
            return;
        }
        
        const snapshot = await db.collection('nodos').get();
        tips = [];
        
        snapshot.forEach(doc => {
            tips.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('[ADMIN_CRUD] Tips cargados:', tips.length);
        
        // Renderizar tips
        renderTips(tips);
        
        // Actualizar contadores de categorías
        renderCategoriesBar();
        
    } catch (error) {
        console.error('[ADMIN_CRUD] Error al cargar tips:', error);
        showMessage('Error al cargar tips: ' + error.message, 'error');
    }
}

// Renderizar tips
function renderTips(tipsToRender) {
    const container = document.getElementById('tipsList');
    if (!container) return;
    
    if (!tipsToRender || tipsToRender.length === 0) {
        container.innerHTML = '<p class="no-results">No hay tips para mostrar. Crea uno nuevo.</p>';
        return;
    }
    
    let html = '';
    
    tipsToRender.forEach(tip => {
        // Obtener color de categoría
        const categoria = categorias.find(c => c.nombre === tip.categoria);
        const color = categoria && categoria.color ? categoria.color : '#666';
        
        html += `
            <div class="tip-card ${tip.destacado ? 'destacado' : ''}" data-id="${tip.id}">
                ${tip.imagen ? `
                    <div class="tip-media">
                        <img src="${tip.imagen}" alt="${tip.titulo || 'Sin título'}" loading="lazy" onerror="this.onerror=null; this.src='../img/logo-trimm-academy.png';">
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
                        <button class="action-btn edit-btn" onclick="editTip('${tip.id}')" title="Editar"></button>
                        <button class="action-btn delete-btn" onclick="deleteTip('${tip.id}')" title="Eliminar"></button>
                        <button class="action-btn highlight-btn ${tip.destacado ? 'highlight-on' : 'highlight-off'}" 
                            onclick="toggleHighlight('${tip.id}', ${!tip.destacado})" 
                            title="${tip.destacado ? 'Quitar destacado' : 'Destacar tip'}">
                            ${tip.destacado ? '⭐' : '☆'}
                        </button>
                    </div>
                    
                    <div class="publico-badge ${tip.publico !== false ? 'visible' : 'hidden'}" title="${tip.publico !== false ? 'Publicado' : 'No publicado'}"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Mostrar modal de tip
function showTipModal(tipId = null) {
    const modal = document.getElementById('tipModal');
    const form = document.getElementById('tipForm');
    
    if (!modal || !form) return;
    
    // Limpiar formulario
    form.reset();
    
    // Establecer título del modal
    document.getElementById('modalTitle').textContent = tipId ? 'Editar Tip' : 'Nuevo Tip';
    
    // Si es edición, cargar datos
    if (tipId) {
        const tip = tips.find(t => t.id === tipId);
        if (tip) {
            form.dataset.tipId = tipId;
            
            document.getElementById('titulo').value = tip.titulo || '';
            document.getElementById('descripcion').value = tip.descripcion || '';
            document.getElementById('categoria').value = tip.categoria || '';
            document.getElementById('contenido').value = tip.contenido || '';
            document.getElementById('imagen').value = tip.imagen || '';
            document.getElementById('video').value = tip.video || '';
            document.getElementById('publico').checked = tip.publico !== false;
            
            // Vista previa de imagen si existe
            if (tip.imagen) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `
                    <div class="preview-container">
                        <img src="${tip.imagen}" alt="Vista previa">
                        <button type="button" class="remove-preview" onclick="document.getElementById('imagePreview').innerHTML = ''; document.getElementById('imagen').value = '';">×</button>
                    </div>
                `;
            }
        }
    } else {
        delete form.dataset.tipId;
    }
    
    // Mostrar modal
    modal.classList.remove('hidden');
}

// Guardar tip
async function saveTip() {
    try {
        console.log('[ADMIN_CRUD] Guardando tip...');
        
        // Mostrar indicador de carga
        showMessage('Guardando tip...', 'info');
        
        const form = document.getElementById('tipForm');
        const tipId = form.dataset.tipId;
        
        // Recopilar datos del formulario
        const data = {
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            categoria: document.getElementById('categoria').value,
            contenido: document.getElementById('contenido').value,
            imagen: document.getElementById('imagen').value,
            video: document.getElementById('video').value,
            publico: document.getElementById('publico').checked,
            actualizado: new Date()
        };
        
        // Validar datos mínimos
        if (!data.titulo) {
            showMessage('El título es obligatorio', 'error');
            return;
        }
        
        if (!data.descripcion) {
            showMessage('La descripción es obligatoria', 'error');
            return;
        }
        
        if (tipId) {
            // Actualizar existente
            await db.collection('nodos').doc(tipId).update(data);
            showMessage('Tip actualizado correctamente', 'success');
        } else {
            // Crear nuevo
            data.creado = new Date();
            const docRef = await db.collection('nodos').add(data);
            showMessage('Tip creado correctamente', 'success');
        }
        
        // Cerrar modal
        document.getElementById('tipModal').classList.add('hidden');
        
        // Recargar tips
        loadTips();
        
    } catch (error) {
        console.error('[ADMIN_CRUD] Error al guardar tip:', error);
        showMessage('Error al guardar tip: ' + error.message, 'error');
    }
}

// Editar tip (función global para usar desde onclick)
window.editTip = function(tipId) {
    showTipModal(tipId);
};

// Eliminar tip (función global para usar desde onclick)
window.deleteTip = async function(tipId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este tip?')) return;
    
    try {
        console.log('[ADMIN_CRUD] Eliminando tip:', tipId);
        
        // Mostrar indicador de carga
        showMessage('Eliminando tip...', 'info');
        
        // Eliminar documento
        await db.collection('nodos').doc(tipId).delete();
        
        // Mostrar mensaje de éxito
        showMessage('Tip eliminado correctamente', 'success');
        
        // Recargar tips
        loadTips();
        
    } catch (error) {
        console.error('[ADMIN_CRUD] Error al eliminar tip:', error);
        showMessage('Error al eliminar tip: ' + error.message, 'error');
    }
};

// Destacar/quitar destacado de tip (función global para usar desde onclick)
window.toggleHighlight = async function(tipId, destacado) {
    try {
        console.log('[ADMIN_CRUD] Cambiando destacado de tip:', tipId, destacado);
        
        // Actualizar documento
        await db.collection('nodos').doc(tipId).update({
            destacado: destacado,
            actualizado: new Date()
        });
        
        // Mostrar mensaje de éxito
        showMessage(destacado ? 'Tip destacado' : 'Tip quitado de destacados', 'success');
        
        // Recargar tips
        loadTips();
        
    } catch (error) {
        console.error('[ADMIN_CRUD] Error al cambiar destacado:', error);
        showMessage('Error al cambiar destacado: ' + error.message, 'error');
    }
};

// Mostrar modal de categorías
function showCategoriesModal() {
    const modal = document.getElementById('categoriesModal');
    if (!modal) return;
    
    // Cargar lista de categorías
    renderCategoriesList();
    
    // Mostrar modal
    modal.classList.remove('hidden');
}

// Renderizar lista de categorías para el modal
function renderCategoriesList() {
    const list = document.getElementById('categoriesList');
    if (!list) return;
    
    if (categorias.length === 0) {
        list.innerHTML = '<li>No hay categorías</li>';
        return;
    }
    
    let html = '';
    
    categorias.forEach(cat => {
        html += `
            <li>
                <div class="category-info">
                    <span class="category-color-indicator" style="background-color: ${cat.color || '#4caf50'}"></span>
                    <span>${cat.nombre}</span>
                </div>
                <div class="category-actions">
                    <button type="button" class="action-btn edit-btn" onclick="editCategory('${cat.id}')" title="Editar categoría"></button>
                    <button type="button" class="category-delete-btn" onclick="deleteCategory('${cat.id}')" title="Eliminar categoría">🗑️</button>
                </div>
            </li>
        `;
    });
    
    list.innerHTML = html;
}

// Guardar categoría
async function saveCategory() {
    try {
        console.log('[ADMIN_CRUD] Guardando categoría...');
        
        // Mostrar indicador de carga
        showMessage('Guardando categoría...', 'info');
        
        const form = document.getElementById('categoryForm');
        const categoryId = form.dataset.categoryId;
        
        // Recopilar datos del formulario
        const data = {
            nombre: document.getElementById('categoryName').value,
            color: document.getElementById('categoryColor').value,
            actualizado: new Date()
        };
        
        // Validar datos mínimos
        if (!data.nombre) {
            showMessage('El nombre es obligatorio', 'error');
            return;
        }
        
        if (categoryId) {
            // Actualizar existente
            await db.collection('categorias').doc(categoryId).update(data);
            showMessage('Categoría actualizada correctamente', 'success');
        } else {
            // Crear nueva
            data.creado = new Date();
            const docRef = await db.collection('categorias').add(data);
            showMessage('Categoría creada correctamente', 'success');
        }
        
        // Limpiar formulario
        form.reset();
        delete form.dataset.categoryId;
        
        // Recargar categorías
        loadCategorias();
        
    } catch (error) {
        console.error('[ADMIN_CRUD] Error al guardar categoría:', error);
        showMessage('Error al guardar categoría: ' + error.message, 'error');
    }
}

// Editar categoría (función global para usar desde onclick)
window.editCategory = function(categoryId) {
    const categoria = categorias.find(c => c.id === categoryId);
    if (!categoria) return;
    
    const form = document.getElementById('categoryForm');
    if (!form) return;
    
    // Guardar ID para edición
    form.dataset.categoryId = categoryId;
    
    // Cargar datos en el formulario
    document.getElementById('categoryName').value = categoria.nombre || '';
    document.getElementById('categoryColor').value = categoria.color || '#4caf50';
    
    // Cambiar texto del botón
    form.querySelector('button[type="submit"]').textContent = 'Actualizar Categoría';
};

// Eliminar categoría (función global para usar desde onclick)
window.deleteCategory = async function(categoryId) {
    const categoria = categorias.find(c => c.id === categoryId);
    if (!categoria) return;
    
    // Verificar si hay tips con esta categoría
    const tipsConCategoria = tips.filter(t => t.categoria === categoria.nombre);
    
    if (tipsConCategoria.length > 0) {
        if (!confirm(`Hay ${tipsConCategoria.length} tips que usan esta categoría. Si la eliminas, esos tips quedarán sin categoría. ¿Deseas continuar?`)) {
            return;
        }
    } else {
        if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${categoria.nombre}"?`)) {
            return;
        }
    }
    
    try {
        console.log('[ADMIN_CRUD] Eliminando categoría:', categoryId);
        
        // Mostrar indicador de carga
        showMessage('Eliminando categoría...', 'info');
        
        // Eliminar documento
        await db.collection('categorias').doc(categoryId).delete();
        
        // Actualizar tips que usaban esta categoría
        if (tipsConCategoria.length > 0) {
            // Procesar en batches de 10 para evitar sobrecarga
            const batches = [];
            const batchSize = 10;
            
            for (let i = 0; i < tipsConCategoria.length; i += batchSize) {
                const batch = db.batch();
                const chunk = tipsConCategoria.slice(i, i + batchSize);
                
                chunk.forEach(tip => {
                    const ref = db.collection('nodos').doc(tip.id);
                    batch.update(ref, {
                        categoria: '',
                        actualizado: new Date()
                    });
                });
                
                batches.push(batch.commit());
            }
            
            await Promise.all(batches);
        }
        
        // Mostrar mensaje de éxito
        showMessage('Categoría eliminada correctamente', 'success');
        
        // Recargar categorías y tips
        loadCategorias();
        
    } catch (error) {
        console.error('[ADMIN_CRUD] Error al eliminar categoría:', error);
        showMessage('Error al eliminar categoría: ' + error.message, 'error');
    }
};

// Mostrar mensaje
function showMessage(message, type = 'info') {
    const container = document.getElementById('errorContainer');
    if (!container) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = type === 'error' ? 'error-message' : 
                             type === 'success' ? 'success-message' : 
                             'info-message';
    messageElement.textContent = message;
    
    container.appendChild(messageElement);
    
    // Eliminar después de 4 segundos
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 4000);
} 