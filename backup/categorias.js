// Mostrar botones de categorías leyendo desde Firestore
const categoriasBar = document.getElementById('categoriasBar');
let todasCategorias = [];
let categoriasSeleccionadas = [];

async function mostrarCategoriasBotones() {
    const snapshot = await db.collection('categories').orderBy('orden').get();
    categoriasBar.innerHTML = '';
    todasCategorias = [];
    snapshot.forEach(doc => {
        const cat = doc.data();
        todasCategorias.push(doc.id);
        const btn = document.createElement('button');
        btn.className = 'categoria-btn';
        btn.textContent = cat.nombre;
        btn.dataset.categoria = doc.id;
        btn.title = 'Haz clic para filtrar por esta categoría';
        btn.onclick = () => toggleCategoria(doc.id);
        categoriasBar.appendChild(btn);
    });
    // Botón seleccionar/deseleccionar todos
    const btnTodos = document.createElement('button');
    btnTodos.id = 'btn-todos';
    btnTodos.textContent = 'Todos';
    btnTodos.title = 'Haz clic para seleccionar o deseleccionar todas las categorías';
    btnTodos.onclick = () => toggleTodos();
    categoriasBar.appendChild(btnTodos);
}

function toggleCategoria(categoriaId) {
    const idx = categoriasSeleccionadas.indexOf(categoriaId);
    if (idx > -1) {
        categoriasSeleccionadas.splice(idx, 1);
    } else {
        categoriasSeleccionadas.push(categoriaId);
    }
    actualizarUI();
    if (typeof window.cargarNodos === 'function') {
        window.cargarNodos([...categoriasSeleccionadas], '');
    }
}

function toggleTodos() {
    if (categoriasSeleccionadas.length === todasCategorias.length) {
        categoriasSeleccionadas = [];
    } else {
        categoriasSeleccionadas = [...todasCategorias];
    }
    actualizarUI();
    if (typeof window.cargarNodos === 'function') {
        window.cargarNodos([...categoriasSeleccionadas], '');
    }
}

function actualizarUI() {
    document.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.classList.toggle('active', categoriasSeleccionadas.includes(btn.dataset.categoria));
    });
    const btnTodos = document.getElementById('btn-todos');
    if (btnTodos) {
        btnTodos.classList.toggle('active', categoriasSeleccionadas.length === todasCategorias.length);
    }
}

window.seleccionarCategoria = toggleCategoria;

document.addEventListener('DOMContentLoaded', () => {
    mostrarCategoriasBotones();
}); 