// Módulo de interfaz de usuario
export const ui = {
    elements: {
        loginContainer: () => document.getElementById('loginContainer'),
        adminPanel: () => document.getElementById('adminPanel'),
        tipsList: () => document.getElementById('tipsList'),
        tipModal: () => document.getElementById('tipModal'),
        tipForm: () => document.getElementById('tipForm'),
        modalTitle: () => document.getElementById('modalTitle'),
        categoriasBar: () => document.getElementById('categoriasBar'),
        searchInput: () => document.getElementById('searchInput')
    },

    showLoginForm() {
        this.elements.loginContainer().classList.remove('hidden');
        this.elements.adminPanel().classList.add('hidden');
    },

    showAdminPanel() {
        this.elements.loginContainer().classList.add('hidden');
        this.elements.adminPanel().classList.remove('hidden');
    },

    showModal(tipId = null) {
        const modal = this.elements.tipModal();
        const form = this.elements.tipForm();
        const title = this.elements.modalTitle();
        
        modal.classList.remove('hidden');
        if (tipId) {
            title.textContent = 'Editar Tip';
            form.dataset.tipId = tipId;
        } else {
            title.textContent = 'Nuevo Tip';
            form.reset();
            delete form.dataset.tipId;
        }
    },

    closeModal() {
        this.elements.tipModal().classList.add('hidden');
        this.elements.tipForm().reset();
    },

    renderCategorias(categorias) {
        const categoriasBar = this.elements.categoriasBar();
        if (!categoriasBar) return;

        const buttons = [
            `<button class="categoria-btn active" data-categoria="">Todos</button>`
        ];

        categorias.forEach(categoria => {
            buttons.push(`
                <button class="categoria-btn" data-categoria="${categoria}">
                    ${categoria}
                </button>
            `);
        });

        categoriasBar.innerHTML = buttons.join('');

        // Agregar eventos a los botones
        categoriasBar.addEventListener('click', (e) => {
            if (e.target.classList.contains('categoria-btn')) {
                // Remover clase active de todos los botones
                categoriasBar.querySelectorAll('.categoria-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Añadir clase active al botón clickeado
                e.target.classList.add('active');
                
                // Filtrar por categoría
                const categoria = e.target.dataset.categoria;
                window.adminModule.filterByCategory(categoria);
            }
        });
    },

    renderTips(tips) {
        const tipsGrid = this.elements.tipsList();
        if (!tipsGrid) return;

        if (!tips.length) {
            tipsGrid.innerHTML = `
                <div class="no-results">
                    <p>No se encontraron tips</p>
                </div>
            `;
            return;
        }

        tipsGrid.innerHTML = tips.map(tip => this.createTipCard(tip)).join('');
    },

    createTipCard(tip) {
        return `
            <div class="card" data-id="${tip.id}">
                ${tip.imagen ? `
                    <div class="card-media">
                        <img src="${tip.imagen}" alt="${tip.titulo}" loading="lazy">
                        ${tip.video ? '<span class="video-indicator">▶</span>' : ''}
                    </div>
                ` : ''}
                <div class="card-content">
                    <h3>${tip.titulo}</h3>
                    <p>${tip.descripcion}</p>
                    <div class="card-footer">
                        <span class="categoria-tag">${tip.categoria}</span>
                        <div class="card-actions">
                            <button onclick="adminModule.editTip('${tip.id}')" class="btn-secondary">Editar</button>
                            <button onclick="adminModule.deleteTip('${tip.id}')" class="btn-secondary">Eliminar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        errorContainer.innerHTML = `
            <div class="error-message">
                ${message}
                <br>
                <small>Por favor, contacta al administrador</small>
            </div>
        `;
        
        setTimeout(() => {
            errorContainer.innerHTML = '';
        }, 5000);
    }
}; 