require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Verificar que existan las variables requeridas
const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Error: Faltan las siguientes variables de entorno:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPor favor, asegúrate de que todas las variables estén definidas en el archivo .env');
    process.exit(1);
}

// Template del archivo env.js con validación
const envFileContent = `// Este archivo se genera automáticamente - NO EDITAR
window._env_ = {
    FIREBASE_API_KEY: '${process.env.FIREBASE_API_KEY}',
    FIREBASE_AUTH_DOMAIN: '${process.env.FIREBASE_AUTH_DOMAIN}',
    FIREBASE_PROJECT_ID: '${process.env.FIREBASE_PROJECT_ID}',
    FIREBASE_STORAGE_BUCKET: '${process.env.FIREBASE_STORAGE_BUCKET}',
    FIREBASE_MESSAGING_SENDER_ID: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
    FIREBASE_APP_ID: '${process.env.FIREBASE_APP_ID}'
};

// Validación de configuración
Object.entries(window._env_).forEach(([key, value]) => {
    if (!value) {
        console.error(\`Error: La variable \${key} no está definida\`);
        throw new Error(\`Configuration Error: \${key} is not defined\`);
    }
});`;

// Asegurarse de que el directorio existe
const publicJsPath = path.join(__dirname, 'public', 'js');
if (!fs.existsSync(publicJsPath)) {
    fs.mkdirSync(publicJsPath, { recursive: true });
}

// Escribir el archivo
fs.writeFileSync(path.join(publicJsPath, 'env.js'), envFileContent);
console.log('✅ Archivo env.js generado correctamente');

// Verificar que el archivo .gitignore incluya env.js
const gitignorePath = path.join(__dirname, '.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

if (!gitignoreContent.includes('public/js/env.js')) {
    console.warn('⚠️  Advertencia: public/js/env.js no está en .gitignore');
    console.warn('   Por favor, asegúrate de que este archivo esté ignorado en git');
} 