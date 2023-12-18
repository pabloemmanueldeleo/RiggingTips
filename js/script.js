document.addEventListener("DOMContentLoaded", function () {
  // Ruta relativa al archivo JSON desde el HTML
  const jsonPath = 'data/nodos.json';

  // Fetch para obtener el archivo JSON
  fetch(jsonPath)
    .then(response => response.json())
    .then(data => {
      // Verificamos que 'nodos' exista y sea un array
      if (data && Array.isArray(data.nodos)) {
        // Llenamos la tabla con los datos del JSON
        llenarTabla(data.nodos);
      } else {
        console.error('La estructura del objeto data no es la esperada.');
      }
    })
    .catch(error => console.error("Error al cargar datos:", error));
});

function llenarTabla(nodos) {
  const tablaBody = document.querySelector('.nodos-table tbody');

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
