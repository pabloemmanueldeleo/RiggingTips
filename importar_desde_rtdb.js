// Script para poblar Firestore con datos limpios y bien estructurados
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Debes tener tu key de servicio

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
  // Categorías
  const categorias = [
    { id: 'rigging', nombre: 'Rigging', color: '#2196F3' },
    { id: 'deformacion', nombre: 'Deformación', color: '#4CAF50' },
    { id: 'animacion', nombre: 'Animación', color: '#F44336' },
    { id: 'problemas', nombre: 'Solución de Problemas', color: '#FF9800' },
    { id: 'workflow', nombre: 'Workflow', color: '#9C27B0' },
    { id: 'scripting', nombre: 'Scripting', color: '#00BCD4' },
    { id: 'facs', nombre: 'Rigging Facial', color: '#006874' }
  ];
  for (const cat of categorias) {
    await db.collection('categorias').doc(cat.id).set(cat);
  }

  // Nodos públicos
  const nodos = [
    {
      titulo: 'FACS System',
      descripcion: 'Configuración de FACS para expresiones faciales',
      categoria: 'facs',
      imagen: '',
      video: '',
      contenido: 'Metodología para configurar un sistema FACS',
      url: '',
      fechaCreacion: new Date(),
      destacado: true,
      publico: true,
      likes: 2,
      dislikes: 0,
      vistas: 10
    },
    {
      titulo: 'Hand Rigging',
      descripcion: 'Rigging avanzado de manos',
      categoria: 'rigging',
      imagen: '',
      video: '',
      contenido: 'Técnicas para crear sistemas funcionales',
      url: '',
      fechaCreacion: new Date(),
      destacado: true,
      publico: true,
      likes: 9,
      dislikes: 2,
      vistas: 7
    },
    {
      titulo: 'Joint Deformation',
      descripcion: 'Corrección de deformaciones en articulaciones',
      categoria: 'deformacion',
      imagen: '',
      video: '',
      contenido: 'Técnicas para corregir los problemas común',
      url: '',
      fechaCreacion: new Date(),
      destacado: false,
      publico: true,
      likes: 5,
      dislikes: 0,
      vistas: 6
    },
    {
      titulo: 'Dynamic Muscles',
      descripcion: 'Sistema de músculos dinámicos',
      categoria: 'deformacion',
      imagen: '',
      video: '',
      contenido: 'Técnicas para crear músculos que reaccionan',
      url: '',
      fechaCreacion: new Date(),
      destacado: false,
      publico: true,
      likes: 0,
      dislikes: 0,
      vistas: 1
    },
    // Nuevos nodos para cubrir todos los filtros y campos
    {
      titulo: 'Python Scripting',
      descripcion: 'Automatización de tareas en Maya con Python',
      categoria: 'scripting',
      imagen: 'https://www.python.org/static/community_logos/python-logo.png',
      video: '',
      contenido: 'Ejemplo de script para automatizar rigs.',
      url: 'https://www.python.org/',
      fechaCreacion: new Date(),
      destacado: false,
      publico: true,
      likes: 3,
      dislikes: 1,
      vistas: 4
    },
    {
      titulo: 'Animación Facial',
      descripcion: 'Técnicas para animar expresiones faciales',
      categoria: 'animacion',
      imagen: '',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      contenido: 'Video demostrativo de animación facial.',
      url: '',
      fechaCreacion: new Date(),
      destacado: true,
      publico: true,
      likes: 6,
      dislikes: 0,
      vistas: 8
    },
    {
      titulo: 'Solución de Problemas de Skinning',
      descripcion: 'Errores comunes y cómo solucionarlos',
      categoria: 'problemas',
      imagen: '',
      video: '',
      contenido: 'Tips para solucionar problemas de skinning.',
      url: '',
      fechaCreacion: new Date(),
      destacado: false,
      publico: true,
      likes: 1,
      dislikes: 0,
      vistas: 2
    },
    {
      titulo: 'Pipeline de Producción',
      descripcion: 'Cómo organizar un workflow eficiente',
      categoria: 'workflow',
      imagen: '',
      video: '',
      contenido: 'Pasos para un pipeline robusto.',
      url: 'https://www.example.com/pipeline',
      fechaCreacion: new Date(),
      destacado: false,
      publico: true,
      likes: 2,
      dislikes: 0,
      vistas: 3
    },
    {
      titulo: 'BlendShapes Avanzados',
      descripcion: 'Creación y uso de blendshapes complejos',
      categoria: 'facs',
      imagen: '',
      video: '',
      contenido: 'Cómo crear blendshapes para expresiones avanzadas.',
      url: '',
      fechaCreacion: new Date(),
      destacado: false,
      publico: true,
      likes: 4,
      dislikes: 0,
      vistas: 5
    },
    {
      titulo: 'Rig Modular',
      descripcion: 'Ventajas de un rig modular',
      categoria: 'rigging',
      imagen: '',
      video: '',
      contenido: 'Cómo estructurar rigs modulares.',
      url: '',
      fechaCreacion: new Date(),
      destacado: false,
      publico: true,
      likes: 2,
      dislikes: 0,
      vistas: 2
    }
  ];
  for (const nodo of nodos) {
    await db.collection('nodos').add(nodo);
  }

  // Admin autorizado
  await db.collection('correosAutorizados').doc('pabloemmanueldeleo@gmail.com').set({ admin: true });

  console.log('Base de datos poblada con datos limpios.');
  process.exit(0);
}

seed().catch(console.error); 