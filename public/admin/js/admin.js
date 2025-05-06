// Importar módulos
import { auth } from './modules/auth.js';
import { ui } from './modules/ui.js';
import { data } from './modules/data.js';

// Módulo principal de administración
const adminModule = {
    currentFilter: '',
    allTips: [],

    async init() {
        try {
            // Inicializar autenticación
            const user = await auth.init();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Verificar estado de autenticación
            if (user && auth.isAdmin(user)) {
                ui.showAdminPanel();
                await this.loadData();
            } else {
                ui.showLoginForm();
                if (user) await auth.logout();
            }
        } catch (error) {
            console.error('Error al inicializar:', error);
            ui.showError('Error al inicializar la aplicación');
        }
    },

    setupEventListeners() {
        // Login/Logout
        document.getElementById('loginButton').addEventListener('click', () => this.handleLogin());
        document.getElementById('logoutButton').addEventListener('click', () => this.handleLogout());
        
        // Gestión de tips
        document.getElementById('newTipButton').addEventListener('click', () => ui.showModal());
        document.getElementById('tipForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        // Hacer accesible el método closeModal globalmente
        window.closeModal = () => ui.closeModal();
        
        // Hacer accesibles los métodos de edición y eliminación
        window.adminModule = {
            editTip: (id) => this.editTip(id),
            deleteTip: (id) => this.deleteTip(id),
            filterByCategory: (category) => this.filterByCategory(category)
        };
    },

    async loadData() {
        try {
            // Cargar categorías
            const categorias = await data.getCategorias();
            ui.renderCategorias(categorias);

            // Cargar tips
            this.allTips = await data.getTips();
            ui.renderTips(this.allTips);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            ui.showError('Error al cargar los datos');
        }
    },

    handleSearch(query) {
        if (!query) {
            ui.renderTips(this.allTips);
            return;
        }

        const searchQuery = query.toLowerCase();
        const filteredTips = this.allTips.filter(tip => 
            tip.titulo.toLowerCase().includes(searchQuery) ||
            tip.descripcion.toLowerCase().includes(searchQuery)
        );

        ui.renderTips(filteredTips);
    },

    filterByCategory(category) {
        if (!category) {
            ui.renderTips(this.allTips);
            return;
        }

        const filteredTips = this.allTips.filter(tip => 
            tip.categoria === category
        );

        ui.renderTips(filteredTips);
    },

    async handleLogin() {
        try {
            const user = await auth.loginWithGoogle();
            if (auth.isAdmin(user)) {
                ui.showAdminPanel();
                await this.loadData();
            } else {
                alert('Acceso denegado. Solo administradores pueden acceder.');
                await auth.logout();
                ui.showLoginForm();
            }
        } catch (error) {
            console.error('Error de login:', error);
            ui.showError('Error al iniciar sesión');
        }
    },

    async handleLogout() {
        try {
            await auth.logout();
            ui.showLoginForm();
            this.allTips = [];
        } catch (error) {
            console.error('Error de logout:', error);
            ui.showError('Error al cerrar sesión');
        }
    },

    async handleFormSubmit(e) {
        e.preventDefault();
        try {
            const form = e.target;
            const tipId = form.dataset.tipId;
            
            const formData = {
                titulo: document.getElementById('titulo').value,
                descripcion: document.getElementById('descripcion').value,
                categoria: document.getElementById('categoria').value,
                publico: document.getElementById('publico').checked,
                imagenFile: document.getElementById('imagen').files[0],
                videoFile: document.getElementById('video').files[0]
            };

            await data.saveTip(formData, tipId);
            ui.closeModal();
            
            // Recargar datos
            await this.loadData();
        } catch (error) {
            console.error('Error al guardar:', error);
            ui.showError('Error al guardar el tip');
        }
    },

    async editTip(tipId) {
        try {
            ui.showModal(tipId);
            const tip = this.allTips.find(t => t.id === tipId);
            if (tip) {
                document.getElementById('titulo').value = tip.titulo || '';
                document.getElementById('descripcion').value = tip.descripcion || '';
                document.getElementById('categoria').value = tip.categoria || '';
                document.getElementById('publico').checked = tip.publico !== false;
            }
        } catch (error) {
            console.error('Error al cargar tip:', error);
            ui.showError('Error al cargar el tip');
        }
    },

    async deleteTip(tipId) {
        if (confirm('¿Estás seguro de que quieres eliminar este tip?')) {
            try {
                await data.deleteTip(tipId);
                // Recargar datos
                await this.loadData();
            } catch (error) {
                console.error('Error al eliminar:', error);
                ui.showError('Error al eliminar el tip');
            }
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => adminModule.init()); 