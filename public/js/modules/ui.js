// Módulo de componentes UI
const UI = {
    // Crear card de nodo
    createNodoCard(nodo) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            ${nodo.imagen ? `<img src="${nodo.imagen}" alt="${nodo.titulo}" loading="lazy">` : ''}
            <div class="card-content">
                <h3>${nodo.titulo}</h3>
                <p>${nodo.descripcion}</p>
                <div class="card-footer">
                    <span class="categoria-tag">${nodo.categoria}</span>
                    ${nodo.url ? `<a href="${nodo.url}" target="_blank" class="btn btn-primary">Ver más</a>` : ''}
                </div>
            </div>
        `;
        return card;
    },

    // Crear botón de categoría
    createCategoryButton(categoria, isActive = false) {
        const button = document.createElement('button');
        button.className = `categoria-btn ${isActive ? 'active' : ''}`;
        button.textContent = categoria.nombre;
        button.title = categoria.descripcion;
        button.dataset.categoriaId = categoria.id;
        return button;
    },

    // Mostrar mensaje de carga
    showLoading(container) {
        container.innerHTML = '<div class="loading">Cargando...</div>';
    },

    // Mostrar mensaje de error
    showError(container, message) {
        container.innerHTML = `<div class="error">${message}</div>`;
    },

    // Limpiar contenedor
    clearContainer(container) {
        container.innerHTML = '';
    },

    // Actualizar grid de nodos
    updateNodosGrid(container, nodos) {
        this.clearContainer(container);
        if (!nodos || nodos.length === 0) {
            container.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
            return;
        }
        
        // Ordenar nodos por orden si existe
        const nodosOrdenados = [...nodos].sort((a, b) => (a.orden || 0) - (b.orden || 0));
        
        nodosOrdenados.forEach(nodo => {
            container.appendChild(this.createNodoCard(nodo));
        });
    },

    // Actualizar menú de categorías
    updateCategoriasMenu(categorias, categoriaActual = null) {
        const menu = document.querySelector('.categories-menu');
        if (!menu) return;

        // Ordenar categorías por orden
        const categoriasOrdenadas = [...categorias].sort((a, b) => (a.orden || 0) - (b.orden || 0));

        menu.innerHTML = categoriasOrdenadas.map(categoria => `
            <a href="#" 
               class="category-link ${categoria.id === categoriaActual?.id ? 'active' : ''}"
               title="${categoria.descripcion}"
               data-categoria-id="${categoria.id}">
                ${categoria.nombre}
            </a>
        `).join('');
    }
};

export default UI;

// Efecto de barra superior semi-transparente al hacer scroll
window.addEventListener('scroll', () => {
    const topBar = document.querySelector('.top-bar');
    if (!topBar) return;
    if (window.scrollY > 10) {
        topBar.classList.add('scrolled');
    } else {
        topBar.classList.remove('scrolled');
    }
});

// Exponer función global para filtrado de categorías (integración con categorias.js)
window.seleccionarCategoria = function(categoriaId) {
    if (window.nodosModule && typeof window.nodosModule.loadNodos === 'function') {
        window.nodosModule.currentFilter = categoriaId;
        window.nodosModule.loadNodos(categoriaId);
    }
}; 