const dotenv = require('dotenv');
dotenv.config();

console.log('=== VERIFICACION DE VARIABLES DE ENTORNO ===\n');

// Instagram
const igUser = process.env.IGusername;
const igPass = process.env.IGpassword;

console.log('INSTAGRAM:');
console.log(`  Username: ${igUser ? 'OK' : 'NO CONFIGURADO'}`);
console.log(`  Password: ${igPass ? 'OK' : 'NO CONFIGURADO'}`);

if (igUser && igPass) {
    console.log(`  Usuario: ${igUser}`);
    console.log(`  Password: ${'*'.repeat(igPass.length)}`);
}

// Gemini
const gemini = process.env.GEMINI_API_KEY_1;
console.log('\nGEMINI AI:');
console.log(`  API Key: ${gemini ? 'OK' : 'NO CONFIGURADA'}`);

// MongoDB
const mongo = process.env.MONGODB_URI;
console.log('\nMONGODB:');
console.log(`  URI: ${mongo ? 'OK' : 'NO CONFIGURADO'}`);

// Server
const port = process.env.PORT || '3000';
const env = process.env.NODE_ENV || 'development';
console.log('\nSERVIDOR:');
console.log(`  Puerto: ${port}`);
console.log(`  Entorno: ${env}`);

// Resumen
console.log('\n=== RESUMEN ===');
if (igUser && igPass) {
    console.log('✅ Credenciales de Instagram: OK');
    console.log('🚀 Puedes ejecutar: npm run test:instagram');
} else {
    console.log('❌ Credenciales de Instagram: FALTAN');
    console.log('💡 Configura IGusername e IGpassword en .env');
}

console.log('\n=== FIN ===');
