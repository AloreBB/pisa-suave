import { IGusername, IGpassword } from '../secret';
import logger from '../config/logger';

/**
 * Script para verificar que las credenciales de Instagram se están cargando
 */
function checkInstagramCredentials() {
    logger.info('🔐 Verificando credenciales de Instagram...');
    
    // Verificar username
    if (IGusername && IGusername !== 'default_IGusername') {
        logger.info(`✅ Username cargado: ${IGusername}`);
    } else {
        logger.warn('⚠️  Username no configurado o usando valor por defecto');
        logger.info('💡 Configura IGusername en tu archivo .env o variables de entorno');
    }
    
    // Verificar password
    if (IGpassword && IGpassword !== 'default_IGpassword') {
        logger.info(`✅ Password cargado: ${'*'.repeat(IGpassword.length)}`);
    } else {
        logger.warn('⚠️  Password no configurado o usando valor por defecto');
        logger.info('💡 Configura IGpassword en tu archivo .env o variables de entorno');
    }
    
    // Verificar que ambas estén configuradas
    if (IGusername && IGpassword && 
        IGusername !== 'default_IGusername' && 
        IGpassword !== 'default_IGpassword') {
        logger.info('🎉 ¡Credenciales de Instagram configuradas correctamente!');
        logger.info('🚀 Puedes ejecutar el análisis de Instagram ahora');
    } else {
        logger.error('❌ Credenciales de Instagram no configuradas correctamente');
        logger.info('\n📋 PASOS PARA CONFIGURAR:');
        logger.info('1. Crea un archivo .env en la raíz del proyecto');
        logger.info('2. Agrega tus credenciales:');
        logger.info('   IGusername=tu_usuario_de_instagram');
        logger.info('   IGpassword=tu_contraseña_de_instagram');
        logger.info('3. Reinicia tu terminal o aplicación');
        logger.info('4. Ejecuta este script nuevamente para verificar');
    }
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
    checkInstagramCredentials();
}

export { checkInstagramCredentials };
