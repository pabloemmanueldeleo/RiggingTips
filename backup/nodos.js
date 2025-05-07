// Funciones para manejar nodos
const nodosGrid = document.getElementById('nodosGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Función para subir una imagen como thumbnail
async function subirThumbnail(file) {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = storage.ref(`thumbnails/${fileName}`);
        await storageRef.put(file);
        return await storageRef.getDownloadURL();
    } catch (error) {
        console.error('Error al subir thumbnail:', error);
        throw error;
    }
}

// Función para subir archivos multimedia
async function subirMedia(file) {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = storage.ref(`media/${fileName}`);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();
        return {
            url,
            fileName,
            type: file.type,
            path: `media/${fileName}`
        };
    } catch (error) {
        console.error('Error al subir media:', error);
        throw error;
    }
}

// Cargar nodos filtrados por categorías múltiples
async function cargarNodos(categorias = [], searchTerm = '') {
    try {
        let query = db.collection('nodos');
        if (categorias && categorias.length === 1) {
            query = query.where('categoria', '==', categorias[0]);
        } else if (categorias && categorias.length > 1) {
            query = query.where('categoria', 'in', categorias);
        }
        const snapshot = await query.get({ source: 'server' });
        const nodos = [];
        snapshot.forEach(doc => {
            const nodo = { id: doc.id, ...doc.data() };
            if (!searchTerm ||
                nodo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                nodo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())) {
                nodos.push(nodo);
            }
        });
        mostrarNodos(nodos);
    } catch (error) {
        console.error('Error al cargar nodos:', error);
        nodosGrid.innerHTML = '<p class="error-message">Error al cargar los tips. Por favor, intenta de nuevo.</p>';
    }
}

// Mostrar nodos en la grid
function mostrarNodos(nodos) {
    if (nodos.length === 0) {
        nodosGrid.innerHTML = '<p class="no-results">No se encontraron tips. ¡Sé el primero en compartir uno!</p>';
        return;
    }
    nodosGrid.innerHTML = '';
    nodos.forEach(nodo => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => mostrarModalNodo(nodo);
        let imgHtml = '';
        if (nodo.media && nodo.media.principal) {
            imgHtml = `<img src="${nodo.media.principal}" alt="${nodo.nombre || nodo.titulo}" onerror="this.style.display='none'">`;
        } else {
            imgHtml = '';
        }
        card.innerHTML = `
            ${imgHtml}
            <div class="card-content">
                <h3>${nodo.nombre || nodo.titulo}</h3>
                <p>${nodo.descripcion}</p>
            </div>
        `;
        nodosGrid.appendChild(card);
    });
}

// Modal para nodo
function mostrarModalNodo(nodo) {
    const modalBg = document.createElement('div');
    modalBg.className = 'modal-bg';
    modalBg.onclick = (e) => { if (e.target === modalBg) document.body.removeChild(modalBg); };
    const modal = document.createElement('div');
    modal.className = 'modal';
    let imgHtml = '';
    if (nodo.media && nodo.media.principal) {
        imgHtml = `<img src="${nodo.media.principal}" alt="${nodo.nombre || nodo.titulo}" onerror="this.style.display='none'">`;
    }
    modal.innerHTML = `
        <button class="close-btn" onclick="document.body.removeChild(this.parentNode.parentNode)">&times;</button>
        ${imgHtml}
        <h3>${nodo.nombre || nodo.titulo}</h3>
        <p>${nodo.descripcion}</p>
        ${nodo.rigging ? `<pre><code>${nodo.rigging}</code></pre>` : ''}
    `;
    modalBg.appendChild(modal);
    document.body.appendChild(modalBg);
}

// Event listeners
searchBtn.addEventListener('click', () => {
    cargarNodos('', searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        cargarNodos('', searchInput.value);
    }
});

window.cargarNodos = cargarNodos;

// Cargar nodos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarNodos();
}); 