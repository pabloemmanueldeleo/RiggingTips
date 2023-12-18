const jsonPath = 'data/nodos.json';
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

  // Simular solicitud GET para cargar datos desde el archivo local
  fetch(jsonPath)
    .then(response => response.json())
    .then(data => {
      if (data && Array.isArray(data.nodos)) {
        // Agregar el nuevo nodo localmente
        data.nodos.push(nuevoNodo);

        // Guardar datos en el archivo original local
        const jsonData = JSON.stringify(data);
        const blob = new Blob([jsonData], { type: 'application/json' });

        // Crear un enlace temporal y hacer clic en él para descargar
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = jsonPath;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log('Datos agregados con éxito.');
        // Actualiza dinámicamente la interfaz de usuario o redirige según sea necesario
      } else {
        console.error('La estructura del objeto data no es la esperada.');
      }
    })
    .catch(error => console.error('Error al cargar JSON:', error));
}
