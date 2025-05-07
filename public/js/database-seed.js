// Script para limpiar y repoblar la base de datos con ejemplos
document.addEventListener('DOMContentLoaded', () => {
    // Escuchar evento de reset desde el panel de admin
    document.addEventListener('reset-database', () => {
        console.log('Evento de reinicio de base de datos recibido');
        initDatabase();
    });
});

// Función principal de inicialización de BD
async function initDatabase() {
    // Esperar a que Firebase esté inicializado
    if (!window.firebaseService || !window.firebaseService.initialized) {
        console.log('Esperando inicialización de Firebase...');
        setTimeout(initDatabase, 100);
        return;
    }
    
    try {
        console.log('Iniciando repoblación de base de datos...');
        const { db, firebase } = window.firebaseService;
        
        // 1. Eliminar colecciones existentes
        await deleteCollection(db, 'nodos');
        await deleteCollection(db, 'categorias');
        
        console.log('Colecciones eliminadas correctamente');
        
        // 2. Crear nuevas categorías
        const categorias = [
            { nombre: 'Rigging Básico' },
            { nombre: 'Rigging Facial' },
            { nombre: 'Animación' },
            { nombre: 'Deformación' },
            { nombre: 'Scripting' },
            { nombre: 'Workflows' },
            { nombre: 'Solución de Problemas' }
        ];
        
        // Guardar categorías
        const categoriasPromises = categorias.map(categoria => 
            db.collection('categorias').add(categoria)
        );
        
        const categoriasResults = await Promise.all(categoriasPromises);
        console.log('Categorías creadas con éxito:', categoriasResults.length);
        
        // 3. Crear nodos de ejemplo
        const nodos = [
            {
                titulo: 'Creación de sistema IK/FK para brazo',
                descripcion: 'Aprende a crear un sistema IK/FK intercambiable para brazos en personajes humanoides.',
                categoria: 'Rigging Básico',
                contenido: `# Sistema IK/FK para brazo

1. Crea una cadena de joints (hombro, codo, muñeca)
2. Duplica la cadena dos veces: una para IK y otra para FK
3. Crea un sistema IK en la primera cadena usando IK Handle
4. Configura controles FK en la segunda cadena
5. Conecta ambos sistemas a la cadena original usando constraints
6. Agrega un atributo para hacer blend entre IK (0) y FK (1)
7. Conecta este atributo a las constraints para intercambiar entre sistemas`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=IK-FK+System',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Configuración de FACS para expresiones faciales',
                descripcion: 'Metodología para configurar un sistema facial basado en FACS (Facial Action Coding System).',
                categoria: 'Rigging Facial',
                contenido: `# Sistema FACS para rigging facial

El sistema FACS (Facial Action Coding System) permite crear expresiones faciales realistas mediante la combinación de unidades de acción (AU).

Pasos principales:
1. Identifica las 20 AUs principales para tu personaje
2. Crea un blendshape por cada AU
3. Configura controles para activar cada AU individualmente
4. Crea presets de expresiones combinando múltiples AUs
5. Organiza los controles en un UI intuitivo para los animadores

Recuerda mantener la simetría donde corresponda y proporcionar controles correctives para poses extremas.`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=FACS+System',
                video: 'https://example.com/facs-demo.mp4',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Corrección de deformaciones en articulaciones',
                descripcion: 'Técnicas para corregir los problemas comunes de deformación en codos, rodillas y hombros.',
                categoria: 'Deformación',
                contenido: `# Corrección de deformaciones en articulaciones

## Problema:
Las articulaciones suelen colapsarse o perder volumen al doblarse en ángulos extremos.

## Soluciones:

### 1. Joints correctivos
- Agrega joints adicionales en la articulación
- Configúralos para compensar la pérdida de volumen
- Usa Set Driven Keys para activarlos según el ángulo de rotación

### 2. Blendshapes correctivos
- Crea shapes correctivos para diferentes ángulos de rotación
- Actívalos mediante Set Driven Keys basados en el ángulo
- Útil cuando la deformación es compleja

### 3. Muscle System
- Implementa un sistema de músculos que mantenga el volumen
- Funciona agregando geometría que simula el comportamiento muscular
- Más realista pero también más complejo de configurar

### 4. Wrap Deformers
- Usa geometría simple (esferas) en las articulaciones
- Aplica wrap deformers para mantener el volumen
- Controla la influencia según el ángulo de rotación`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=Joint+Deformation',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Automatización de rigs con Python',
                descripcion: 'Scripts para automatizar la creación de rigs para diferentes tipos de personajes.',
                categoria: 'Scripting',
                contenido: `# Automatización de rigs con Python

\`\`\`python
# Ejemplo básico para crear una cadena IK
import maya.cmds as cmds

def create_ik_chain(name_prefix, start_joint, end_joint, control_size=1.0):
    """
    Crea un sistema IK básico
    
    Args:
        name_prefix (str): Prefijo para nombrar los objetos
        start_joint (str): Nombre del joint inicial
        end_joint (str): Nombre del joint final
        control_size (float): Tamaño del control
    
    Returns:
        dict: Diccionario con los objetos creados
    """
    # Crear IK handle
    ik_handle, ik_effector = cmds.ikHandle(
        name=f"{name_prefix}_ikHandle",
        startJoint=start_joint,
        endEffector=end_joint,
        solver="ikRPsolver"
    )
    
    # Crear control
    ik_control = cmds.circle(
        name=f"{name_prefix}_ctrl",
        normal=[1, 0, 0],
        radius=control_size
    )[0]
    
    # Posicionar control en el end joint
    end_joint_pos = cmds.xform(end_joint, query=True, worldSpace=True, translation=True)
    cmds.xform(ik_control, worldSpace=True, translation=end_joint_pos)
    
    # Conectar control e IK handle
    constraint = cmds.parentConstraint(ik_control, ik_handle, maintainOffset=True)
    
    return {
        "ik_handle": ik_handle,
        "ik_effector": ik_effector,
        "control": ik_control,
        "constraint": constraint
    }

# Ejemplo de uso
# result = create_ik_chain("arm_L", "shoulder_L", "wrist_L", 2.0)
# print(result)
\`\`\`

Este es un ejemplo simple del tipo de funciones que puedes crear para automatizar partes de tu proceso de rigging. A partir de aquí, puedes extender estos scripts para crear sistemas más complejos o incluso rigs completos.`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=Python+Automation',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Skinning no destructivo con deltaMush',
                descripcion: 'Técnica de skinning avanzada que permite mantener detalle en las deformaciones.',
                categoria: 'Deformación',
                contenido: `# Skinning no destructivo con DeltaMush

## ¿Qué es DeltaMush?

DeltaMush es un deformador que preserva los detalles de la superficie durante la deformación. Funciona en dos pasos:
1. Suaviza la geometría deformada, eliminando detalles
2. Reaplica los detalles originales en la nueva posición

## Ventajas:
- Preserva detalles de superficie
- Reduce artefactos de skinning
- Ideal para topologías complejas
- Menor tiempo dedicado a weight painting

## Implementación:
1. Configura un skinning básico (no tiene que ser perfecto)
2. Aplica el deformador DeltaMush
3. Ajusta los parámetros:
   - Iterations: controla la cantidad de suavizado (3-10)
   - Smooth Scale: intensidad del suavizado (0-1)
   - Delta Scale: intensidad del mapeo de detalles (0-1)

## Consideraciones:
- Mayor costo computacional que skinning tradicional
- Puede necesitar optimización para producción
- Idealmente se "hornea" en pesos de skinning para rendimiento final

Para resultados óptimos, combina un skinning básico bien hecho con DeltaMush para refinamiento.`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=DeltaMush+Skinning',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Exportación correcta de rigs a Unity',
                descripcion: 'Proceso paso a paso para exportar rigs creados en Maya para su uso en Unity.',
                categoria: 'Workflows',
                contenido: `# Exportación de Rigs a Unity

## Preparación del Rig:
- Usar esqueleto compatible con Mecanim
- Orientación correcta: Z+ hacia adelante, Y+ arriba
- T-Pose estándar
- Escala uniformizada (normalmente 1.0)
- Reset de todos los transformados a valores limpios

## Configuración de Exportación:
1. Seleccionar sólo el esqueleto y la mesh
2. Usar formato FBX
3. Opciones de exportación:
   - FBX Version: 2018+
   - Animation: Activado si incluye animaciones
   - Bake Animation: Activado
   - Deformed Models: Activado
   - Skins: Activado
   - Quaternion interpolation para rotaciones
   - Sample animation: 30fps

## Configuración en Unity:
1. Importar el FBX
2. En la pestaña Rig:
   - Animation Type: Humanoid
   - Avatar Definition: Create From This Model
   - Configure... y verificar asignación de huesos
3. En la pestaña Animation:
   - Import Animation: Activado
   - Loop Time: Según necesidad
   - Root Transform Position: Baked into Poses

## Solución de problemas comunes:
- Escala incorrecta: Asegurar que la unidad de escena en Maya coincide con Unity (cm)
- Rotaciones extrañas: Verificar orientación de joints
- Pérdida de skinning: Asegurar que la mesh tiene transformaciones congeladas
- Inversión normals: Verificar opción Flip Normals en la importación`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=Unity+Export',
                video: 'https://example.com/unity-export-demo.mp4',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Solución a joints bloqueados en IK spline',
                descripcion: 'Cómo resolver el problema común de joints que no se mueven correctamente al usar IK spline.',
                categoria: 'Solución de Problemas',
                contenido: `# Solución a joints bloqueados en IK spline

## Problema:
Al usar IK spline para columnas vertebrales o tentáculos, los joints a veces se "bloquean" o no se distribuyen correctamente a lo largo de la curva.

## Causas comunes:
1. Curva con puntos demasiado cercanos o sobrepuestos
2. Orientación incorrecta de los joints iniciales
3. Configuración incorrecta del Up Vector
4. Demasiados joints para la longitud de la curva
5. Configuración incorrecta del algoritmo de rotación

## Soluciones:

### 1. Reconstruir la curva:
- Usa Rebuild Curve con menos puntos CV
- Elimina puntos redundantes
- Asegura que la curva no tenga puntos demasiado cercanos

### 2. Corregir el Up Vector:
- Utiliza un objeto como Up Vector en lugar de un vector estático
- Posiciona el objeto Up Vector perpendicular a la dirección deseada
- Ajusta la configuración de Twist para evitar flips

### 3. Modificar parámetros del IK Handle:
- Cambia el parámetro de Root On Curve a On/Off
- Ajusta los valores de Forward Axis y Up Axis
- Modifica el Root Twist y End Effector Twist

### 4. Solución alternativa:
- Usa Ribbon Spine en lugar de IK Spline
- Crea un sistema personalizado con clusters y constraints
- Distribuye los joints manualmente usando expresiones

Recuerda que cada situación puede requerir una combinación de estas soluciones.`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=Spline+IK+Fix',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Sistema de músculos dinámicos',
                descripcion: 'Técnica para crear músculos que reaccionan dinámicamente al movimiento.',
                categoria: 'Deformación',
                contenido: `# Sistema de músculos dinámicos

## Descripción general:
Un sistema de músculos dinámicos permite simular el comportamiento de músculos reales durante la animación. Esto incluye:
- Bulging durante contracciones
- Jiggle durante movimientos rápidos
- Mantenimiento de volumen
- Colisiones con otros músculos/huesos

## Implementación base:

### 1. Geometría muscular:
- Modelar músculos individuales como geometrías separadas
- Posicionarlos anatómicamente entre los joints correspondientes
- Crear una versión simplificada para la dinámica

### 2. Configuración de deformación:
\`\`\`mel
// Ejemplo de script para configurar músculos dinámicos
string $muscle = "bicep_L";
string $startJoint = "shoulder_L";
string $endJoint = "elbow_L";

// Crear curva entre joints para orientación
string $curve[] = \`curve -d 1 -p 0 0 0 -p 1 0 0\`;
string $startPos[] = \`xform -q -ws -t $startJoint\`;
string $endPos[] = \`xform -q -ws -t $endJoint\`;
setAttr ($curve[0] + ".controlPoints[0].xValue") $startPos[0];
setAttr ($curve[0] + ".controlPoints[0].yValue") $startPos[1];
setAttr ($curve[0] + ".controlPoints[0].zValue") $startPos[2];
setAttr ($curve[0] + ".controlPoints[1].xValue") $endPos[0];
setAttr ($curve[0] + ".controlPoints[1].yValue") $endPos[1];
setAttr ($curve[0] + ".controlPoints[1].zValue") $endPos[2];

// Configurar deformadores
string $wire[] = \`wire -w 0 -dds 0 1 -li 0.5 -n ($muscle+"_wire") $muscle $curve[0]\`;
string $softMod[] = \`softMod -n ($muscle+"_softMod") $muscle\`;
\`\`\`

### 3. Crear controles para:
- Volumen base del músculo
- Tensión/contracción
- Masa/peso (afecta el jiggle)
- Flacidez (damping)

### 4. Conexión a la animación:
- Usar Set Driven Keys para conectar rotación de joint a contracción
- Añadir nodos multiplier para controlar intensidad
- Usar expresiones para calcular velocidad y aplicar jiggle

## Refinamiento:
- Agregar colisiones entre músculos
- Crear controles globales para sistema muscular completo
- Balancear perfomance vs. realismo
- Añadir capa de venas/tendones para detalle adicional`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=Dynamic+Muscles',
                publico: false,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Ciclo de caminata para cuadrúpedos',
                descripcion: 'Guía para animar ciclos de caminata naturales para personajes de cuatro patas.',
                categoria: 'Animación',
                contenido: `# Ciclo de caminata para cuadrúpedos

## Secuencia básica:
Un ciclo completo para una caminata de cuadrúpedo sigue generalmente este patrón:
1. Pata trasera derecha
2. Pata delantera izquierda
3. Pata trasera izquierda
4. Pata delantera derecha

## Timing:
- Para caminata lenta: 30% overlap entre movimientos de patas
- Para trote: pares diagonales se mueven sincronizados
- Para galope: pares traseros y delanteros se mueven juntos

## Consejos para ciclos creíbles:
- El peso corporal debe transferirse diagonalmente
- La cadera sube cuando las patas traseras están en el suelo
- La espalda debe flexionarse ligeramente durante el ciclo
- La cabeza debe moverse en un patrón suave, no rígido
- Mantén un ligero balanceo lateral (pero no exagerado)

## Errores comunes:
- Patas que resbalan en el suelo
- Línea de espalda demasiado rígida
- Falta de transferencia de peso
- Timing mecánico (demasiado regular)
- Cola sin reacción al movimiento del cuerpo

## Estudio de referencia:
Estudia diferentes animales para variaciones:
- Caballo: movimiento elegante, cuello alto
- León/tigre: postura baja, movimiento sigiloso
- Perro: más casual, mayor rebote
- Elefante: pesado, piernas en forma de columnas

Para animales como jirafas o camellos, presta atención a las particularidades de sus ciclos únicos.`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=Quadruped+Walk+Cycle',
                video: 'https://example.com/quadruped-demo.mp4',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Rigging avanzado de manos',
                descripcion: 'Técnicas para crear sistemas funcionales y realistas para manos en personajes humanoides.',
                categoria: 'Rigging Básico',
                contenido: `# Rigging avanzado de manos

## Estructura de joints:
- 1 joint para la muñeca
- 5 joints para metacarpianos (base de dedos)
- 3 joints por dedo (falange proximal, media, distal)
- Opcional: 1 joint adicional por falange para roll

## Sistema de control:

### Controles básicos:
- Control global para toda la mano
- Control para la muñeca
- Control para cada dedo
- Control para el pulgar (independiente)

### Sistema avanzado:
- Atributos de curl (0-10) para flexión progresiva
- Atributo de spread para separación lateral
- Atributo de cup para curvatura natural
- Presets para poses comunes (puño, relajada, señalar, etc)

## SDKs y Relaciones:
\`\`\`mel
// Ejemplo de configuración para curl progresivo
// Crear atributo en control
addAttr -ln "indexCurl" -at double -min 0 -max 10 -dv 0 hand_ctrl;
setAttr -e -keyable true hand_ctrl.indexCurl;

// Configurar SDKs para articulaciones
// curl = 0: dedos extendidos
setDrivenKeyframe -cd hand_ctrl.indexCurl -dv 0 
    -attribute rotateZ -v 0 index_joint_1;
setDrivenKeyframe -cd hand_ctrl.indexCurl -dv 0 
    -attribute rotateZ -v 0 index_joint_2;
setDrivenKeyframe -cd hand_ctrl.indexCurl -dv 0 
    -attribute rotateZ -v 0 index_joint_3;

// curl = 10: dedo cerrado
setDrivenKeyframe -cd hand_ctrl.indexCurl -dv 10 
    -attribute rotateZ -v 80 index_joint_1;
setDrivenKeyframe -cd hand_ctrl.indexCurl -dv 10 
    -attribute rotateZ -v 90 index_joint_2;
setDrivenKeyframe -cd hand_ctrl.indexCurl -dv 10 
    -attribute rotateZ -v 45 index_joint_3;
\`\`\`

## Consideraciones adicionales:
- Curvaturas naturales (dedos no están completamente rectos)
- Interdependencia entre dedos (el meñique sigue al anular)
- Límites de rotación realistas
- Opciones para IK de dedos (útil para agarrar objetos)
- Sticky fingers para contacto con superficies

## Optimización para animadores:
- UI personalizada con sliders para todas las poses
- Esquema de selección intuitivo
- Posibilidad de seleccionar múltiples dedos a la vez
- Opción para espejar poses entre manos`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=Hand+Rigging',
                publico: true,
                creado: firebase.firestore.Timestamp.now()
            },
            {
                titulo: 'Transferencia de rigs entre personajes',
                descripcion: 'Técnicas para reutilizar rigs existentes en nuevos personajes con diferente topología.',
                categoria: 'Workflows',
                contenido: `# Transferencia de rigs entre personajes

## Métodos principales:

### 1. Wrapped Copy Skinning:
- Ideal para personajes con proporciones similares
- El personaje objetivo debe tener la misma escala general
- Pasos:
  1. Posicionar ambos personajes en la misma pose
  2. Copiar estructura del rig (joints, controles)
  3. Reposicionar joints para adaptarse
  4. Usar wrap deformer temporal
  5. Copiar pesos del skin original al nuevo
  6. Remover wrap deformer

### 2. Transferencia basada en topología:
- Para cuando la topología es similar pero no idéntica
- Usa correspondencias de vértices para transferir
- Herramientas como ngSkin o Maya copySkinWeights
- Requiere mapeo de joints entre modelos

### 3. Adaptación completa de rig:
- Para personajes muy diferentes
- Reutiliza lógica y estructura pero rehace conexiones
- Mantiene nomenclatura y organización
- Ajusta parámetros para proporciones nuevas

## Script de ejemplo para transferencia:

\`\`\`python
import maya.cmds as cmds

def transfer_rig(source_mesh, target_mesh, source_joints, target_joints):
    """
    Transfiere pesos de skinning entre personajes
    
    Args:
        source_mesh: Malla original con skinning
        target_mesh: Malla nueva que recibirá el skinning
        source_joints: Lista de joints originales
        target_joints: Lista de joints nuevos (mismo orden)
    """
    # Crear skinCluster en target si no existe
    skinCluster = None
    try:
        skinCluster = cmds.skinCluster(target_mesh, q=True)
    except:
        skinCluster = cmds.skinCluster(
            target_joints, 
            target_mesh, 
            tsb=True, 
            name=f"{target_mesh}_skinCluster"
        )[0]
    
    # Transferir pesos
    cmds.copySkinWeights(
        sourceSkin=f"{source_mesh}_skinCluster",
        destinationSkin=skinCluster,
        noMirror=True,
        surfaceAssociation='closestPoint',
        influenceAssociation='name'
    )
    
    return skinCluster
\`\`\`

## Consideraciones:
- Puede requerir limpieza manual de pesos
- Adaptar tamaño y posición de controles
- Revisar y ajustar constraints
- Validar funcionamiento en poses extremas
- Crear poses de corrección específicas para el nuevo personaje`,
                imagen: 'https://placehold.co/600x400/006874/fff?text=Rig+Transfer',
                publico: false,
                creado: firebase.firestore.Timestamp.now()
            }
        ];
        
        // Guardar nodos
        const nodosPromises = nodos.map(nodo => db.collection('nodos').add(nodo));
        
        await Promise.all(nodosPromises);
        console.log('Nodos de ejemplo creados con éxito');
        
        // Recargar la página
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('Error al repoblar la base de datos:', error);
    }
}

// Función auxiliar para eliminar una colección
async function deleteCollection(db, collectionPath) {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();
    
    // Eliminar todos los documentos
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    
    return batch.commit();
} 