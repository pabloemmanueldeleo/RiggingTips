document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var db = firebase.firestore();
  var nodosRef = db.collection("nodos");
  const jsonPath = 'data/nodos.json';

  // Obtener datos de la colección
  nodosRef.get().then(querySnapshot => {
    if (!querySnapshot.empty) {
      // La colección tiene documentos
      const nodos = [];
      querySnapshot.forEach(doc => {
        // Agregar datos del documento a tu array nodos
        nodos.push(doc.data());
      });

      // Llenar la tabla con los datos obtenidos
      llenarTabla(nodos);
    } else {
      // No hay documentos en la colección, intentar cargar desde el archivo JSON
      cargarDesdeJSON();
    }
  }).catch(error => {
    console.error('Error al obtener datos de la colección:', error);

    // Si hay un error, intentar cargar desde el archivo JSON
    cargarDesdeJSON();
  });

  // Escuchar cambios en la colección y actualizar la tabla
  nodosRef.onSnapshot(querySnapshot => {
    const nodos = [];
    querySnapshot.forEach(doc => {
      nodos.push(doc.data());
    });

    llenarTabla(nodos);
  }, error => {
    console.error("Error al escuchar cambios en la colección:", error);
  });
});

function cargarDesdeJSON() {
  // Intentar cargar desde el archivo JSON
  fetch(jsonPath)
    .then(response => response.json())
    .then(data => {
      // Verificar que hay nodos en el archivo JSON
      if (data && Array.isArray(data.nodos)) {
        llenarTabla(data.nodos);
        console.log('Datos cargados desde el archivo JSON.');
      } else {
        console.error('La estructura del objeto data no es la esperada en el archivo JSON.');
      }
    })
    .catch(error => console.error('Error al cargar datos desde el JSON:', error));
}

function llenarTabla(nodos) {
  const tablaBody = document.querySelector('.nodos-table tbody');
  tablaBody.innerHTML = ''; // Limpiamos la tabla antes de llenarla nuevamente

  nodos.forEach(nodo => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${nodo.nombre}</td>
      <td>${nodo.descripcion}</td>
      <td>${nodo.rigging}</td>
      <td>${nodo.organicos}</td>
      <td>${nodo.inorganicos}</td>
    `;
    tablaBody.appendChild(fila);
  });
}
