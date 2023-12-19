// Asegúrate de que firebase ha sido inicializado antes de esta línea
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var nodosRef = db.collection("nodos");

function agregarDatos() {
  const nombre = document.getElementById('nombre').value;
  const descripcion = document.getElementById('descripcion').value;
  const rigging = document.getElementById('rigging').value;
  const organicos = document.getElementById('organicos').value;
  const inorganicos = document.getElementById('inorganicos').value;

  const nuevoNodo = {
    nombre: nombre,
    descripcion: descripcion,
    rigging: rigging,
    organicos: organicos,
    inorganicos: inorganicos
  };

  if (verificarConfiguracionFirebase()) {
    // Configuración de Firebase presente, intentar agregar datos a Firestore
    agregarDatosFirestore(nuevoNodo);
  } else {
    // Mostrar mensaje de configuración faltante
    mostrarMensajeConfiguracionFaltante();
  }
}

function agregarDatosFirestore(nuevoNodo) {
  nodosRef.add(nuevoNodo)
    .then(() => {
      console.log('Datos agregados con éxito.');
      // Actualiza dinámicamente la interfaz de usuario o redirige según sea necesario
    })
    .catch(error => {
      console.error('Error al agregar datos a Firebase:', error);
      // Muestra mensajes de error al usuario o maneja de alguna manera
    });
}

function verificarConfiguracionFirebase() {
  // Verifica que firebaseConfig esté definido y tenga los campos necesarios
  return firebaseConfig && firebaseConfig.apiKey;
}

function mostrarMensajeConfiguracionFaltante() {
  alert('¡Advertencia!\n\nSe necesita configurar el archivo de Firebase para cargar datos en la nube. Por favor, revisa la configuración.');
}
