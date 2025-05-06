// Script para agregar categorías principales y de prueba a Firestore
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Categorías principales y de prueba
const categorias = [
  { id: 'rigging', nombre: 'Rigging', descripcion: 'Tips de rigging y controladores' },
  { id: 'matematicas', nombre: 'Matemáticas para Rigging', descripcion: 'Tips de matemáticas aplicadas al rigging' },
  { id: 'programacion', nombre: 'Programación', descripcion: 'Automatización y scripts para rigging' },
  { id: 'pipeline', nombre: 'Pipeline', descripcion: 'Organización y flujo de trabajo en producción' },
  { id: 'errores', nombre: 'Errores Comunes', descripcion: 'Problemas frecuentes y soluciones en rigging' },
  { id: 'bolsa', nombre: 'Bolsa de Trabajo', descripcion: 'Ofertas y recursos laborales para riggers' },
  { id: 'nodos', nombre: 'Nodos', descripcion: 'Tips relacionados con nodos de Maya', orden: 1 }
];

// Tips de ejemplo
const tips = [
  {
    titulo: 'Cómo crear un controlador simple',
    descripcion: 'Usa un círculo NURBS para controlar el joint.',
    categoria: 'rigging'
  },
  {
    titulo: 'Matrices en Maya',
    descripcion: 'Las matrices permiten transformar objetos de forma eficiente.',
    categoria: 'matematicas'
  },
  {
    titulo: 'Script para renombrar joints',
    descripcion: 'Un script en Python para renombrar todos los joints de una cadena.',
    categoria: 'programacion'
  },
  {
    titulo: 'Errores comunes al exportar FBX',
    descripcion: 'Verifica las escalas y los nombres antes de exportar.',
    categoria: 'errores'
  },
  {
    titulo: 'Cómo buscar trabajo de rigger',
    descripcion: 'Revisa foros y grupos de Facebook especializados.',
    categoria: 'bolsa'
  }
];

async function importarCategorias() {
  const batch = db.batch();
  categorias.forEach(cat => {
    const ref = db.collection('categories').doc(cat.id);
    batch.set(ref, { nombre: cat.nombre, descripcion: cat.descripcion, orden: cat.orden || 0 });
  });
  await batch.commit();
  console.log('Categorías principales y de prueba importadas');
}

async function importarTips() {
  const batch = db.batch();
  tips.forEach(tip => {
    const ref = db.collection('nodos').doc();
    batch.set(ref, tip);
  });
  await batch.commit();
  console.log('Tips importados');
}

async function main() {
  await importarCategorias();
  await importarTips();
  console.log('¡Importación completada!');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 