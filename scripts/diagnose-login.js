#!/usr/bin/env node

// ========================================
// 🔍 DIAGNÓSTICO DE LOGIN DE INSTAGRAM
// ========================================
// Script para diagnosticar problemas de login

require('dotenv').config();

console.log('🔍 DIAGNÓSTICO DE LOGIN DE INSTAGRAM\n');

// Verificar variables de entorno
const username = process.env.IGusername;
const password = process.env.IGpassword;

if (!username || !password) {
    console.log('❌ CREDENCIALES NO CONFIGURADAS');
    console.log('💡 Ejecuta: npm run check:env');
    process.exit(1);
}

console.log('📱 CREDENCIALES:');
console.log(`   Usuario: ${username}`);
console.log(`   Password: ${'*'.repeat(password.length)}`);
console.log('');

// Verificar formato de credenciales
console.log('🔍 ANÁLISIS DE CREDENCIALES:');

if (username.length < 3) {
    console.log('   ❌ Username muy corto (mínimo 3 caracteres)');
} else {
    console.log('   ✅ Username tiene formato válido');
}

if (password.length < 6) {
    console.log('   ❌ Password muy corta (mínimo 6 caracteres)');
} else {
    console.log('   ✅ Password tiene longitud válida');
}

// Verificar si el username tiene caracteres especiales
const usernameRegex = /^[a-zA-Z0-9._]+$/;
if (!usernameRegex.test(username)) {
    console.log('   ⚠️  Username contiene caracteres especiales');
} else {
    console.log('   ✅ Username solo contiene caracteres válidos');
}

console.log('');

// Recomendaciones
console.log('💡 RECOMENDACIONES:');
console.log('   1. Verifica que la cuenta no esté bloqueada');
console.log('   2. Desactiva temporalmente la verificación en dos pasos');
console.log('   3. Intenta hacer login manual en Instagram.com');
console.log('   4. Verifica que no haya captcha pendiente');
console.log('   5. Usa una cuenta secundaria para testing');

console.log('');

// Próximos pasos
console.log('🚀 PRÓXIMOS PASOS:');
console.log('   1. Ejecuta: npm run test:instagram');
console.log('   2. Si falla, revisa los logs detallados');
console.log('   3. Completa verificación manual si es necesario');
console.log('   4. Intenta nuevamente');

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
