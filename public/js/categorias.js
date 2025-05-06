// Mostrar botones de categorías leyendo desde Firestore
const categoriasModule = {
    db: null,
    categoriasBar: null,
    categorias: [
        { id: 'programacion', nombre: 'Programación', descripcion: 'Scripts y herramientas de programación' },
        { id: 'bolsa', nombre: 'Bolsa de Trabajo', descripcion: 'Ofertas y recursos laborales para riggers' },
        { id: 'rigging', nombre: 'Rigging', descripcion: 'Tips y técnicas de rigging' },
        { id: 'errores', nombre: 'Errores', descripcion: 'Soluciones a errores comunes' },
        { id: 'matematicas', nombre: 'Matemáticas', descripcion: 'Conceptos matemáticos para rigging' },
        { id: 'nodos', nombre: 'Nodos', descripcion: 'Tips sobre nodos y conexiones' },
        { id: 'pipeline', nombre: 'Pipeline', descripcion: 'Flujos de trabajo y pipeline' }
    ],

    init() {
        this.db = firebase.firestore();
        this.categoriasBar = document.getElementById('categoriasBar');
        this.renderCategorias();
    },

    renderCategorias() {
        if (!this.categoriasBar) return;
        
        // Crear botones de categoría
        const botonesHtml = this.categorias.map(categoria => `
            <button class="categoria-btn" 
                    data-categoria="${categoria.id}"
                    title="${categoria.descripcion}">
                ${categoria.nombre}
            </button>
        `).join('');

        // Agregar botón "Todos"
        this.categoriasBar.innerHTML = `
            <button class="categoria-btn active" data-categoria="todos">
                Todos
            </button>
            ${botonesHtml}
        `;

        // Eventos de click
        this.categoriasBar.addEventListener('click', (e) => {
            if (e.target.classList.contains('categoria-btn')) {
                const categoriaId = e.target.dataset.categoria;
                
                // Actualizar UI
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