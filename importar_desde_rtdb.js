// Script para importar datos desde RTDB export a Firestore
const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Leer archivo de exportación
const rtdbData = JSON.parse(fs.readFileSync('riggingtips-default-rtdb-export.json', 'utf8'));

// 1. Importar categoría principal "nodos"
async function importarCategoriaNodos() {
  const cat = rtdbData.tips.categorias.nodos;
  if (!cat) return;
  await db.collection('categories').doc(cat.id).set({
    nombre: cat.nombre,
    descripcion: cat.descripcion,
    orden: cat.orden || 0
  });
  console.log('Categoría "nodos" importada');
}

// 2. Importar tips (nodos)
async function importarNodos() {
  const nodos = rtdbData.tips.contenido.nodos;
  if (!nodos) return;
  const batch = db.batch();
  Object.keys(nodos).forEach(key => {
    const nodo = nodos[key];
    const ref = db.collection('nodos').doc(key);
    batch.set(ref, {
      nombre: nodo.nombre,
      descripcion: nodo.descripcion,
      categoria: 'nodos',
      tipo: nodo.tipo || '',
      rigging: nodo.rigging || '',
      organicos: nodo.organicos || '',
      inorganicos: nodo.inorganicos || '',
      media: nodo.media || {}
    });
  });
  await batch.commit();
  console.log('Nodos importados');
}

async function main() {
  await importarCategoriaNodos();
  await importarNodos();
  console.log('¡Importación desde RTDB completada!');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 