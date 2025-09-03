import { IgClient } from '../client/IG-bot/IgClient';
import { InstagramAnalysisData } from '../types/instagram';
import logger from '../config/logger';

/**
 * Script de prueba para validar el análisis de Instagram
 * Analiza 5 posts del perfil @inducascos para verificar funcionalidad
 */
async function testInstagramAnalysis() {
    const igClient = new IgClient();
    
    try {
        logger.info('🚀 Iniciando prueba de análisis de Instagram...');
        
        // Inicializar cliente
        await igClient.init();
        logger.info('✅ Cliente de Instagram inicializado correctamente');
        
        // Realizar análisis de prueba
        const analysisData: InstagramAnalysisData = await igClient.scrapeInstagramAnalysis(
            'inducascos',
            {
                daysBack: 30,
                maxPosts: 5,
                maxCommentsPerPost: 10,
                includeMediaUrls: false,
                rateLimitMs: 4000
            }
        );
        
        // Mostrar resultados
        logger.info('📊 RESULTADOS DEL ANÁLISIS:');
        logger.info(`👤 Usuario: @${analysisData.username}`);
        logger.info(`📅 Fecha de análisis: ${analysisData.analysisDate}`);
        logger.info(`📈 Período analizado: ${analysisData.period}`);
        logger.info(`📝 Total de posts: ${analysisData.totalPosts}`);
        
        // Resumen general
        const { summary } = analysisData;
        logger.info('\n📊 RESUMEN GENERAL:');
        logger.info(`❤️ Total de likes: ${summary.totalLikes.toLocaleString()}`);
        logger.info(`💬 Total de comentarios: ${summary.totalComments.toLocaleString()}`);
        logger.info(`📊 Engagement promedio: ${summary.averageEngagement}`);
        
        // Desglose por tipo de contenido
        logger.info('\n🎨 DESGLOSE POR TIPO DE CONTENIDO:');
        logger.info(`🖼️ Imágenes: ${summary.contentTypeBreakdown.images}`);
        logger.info(`🔄 Carruseles: ${summary.contentTypeBreakdown.carousels}`);
        logger.info(`🎥 Videos: ${summary.contentTypeBreakdown.videos}`);
        
        // Análisis de sentiment
        logger.info('\n😊 ANÁLISIS DE SENTIMENT:');
        logger.info(`😍 Positivos: ${summary.sentimentBreakdown.positive}`);
        logger.info(`😞 Negativos: ${summary.sentimentBreakdown.negative}`);
        logger.info(`😐 Neutros: ${summary.sentimentBreakdown.neutral}`);
        
        // Post con mayor engagement
        if (summary.mostEngagedPost) {
            logger.info('\n🏆 POST CON MAYOR ENGAGEMENT:');
            logger.info(`📝 Caption: ${summary.mostEngagedPost.caption.substring(0, 100)}...`);
            logger.info(`❤️ Likes: ${summary.mostEngagedPost.likes}`);
            logger.info(`💬 Comentarios: ${summary.mostEngagedPost.comments.length}`);
            logger.info(`📊 Engagement: ${summary.mostEngagedPost.engagement}`);
        }
        
        // Detalles de posts individuales
        logger.info('\n📋 DETALLES DE POSTS:');
        analysisData.posts.forEach((post, index) => {
            logger.info(`\n--- POST ${index + 1} ---`);
            logger.info(`🆔 ID: ${post.id}`);
            logger.info(`📅 Fecha: ${post.date}`);
            logger.info(`🎨 Tipo: ${post.type}`);
            logger.info(`❤️ Likes: ${post.likes}`);
            logger.info(`💬 Comentarios: ${post.comments.length}`);
            logger.info(`📊 Engagement: ${post.engagement}`);
            logger.info(`🏷️ Hashtags: ${post.hashtags.join(', ') || 'Ninguno'}`);
            logger.info(`👥 Menciones: ${post.mentions.join(', ') || 'Ninguna'}`);
            
            // Mostrar algunos comentarios representativos
            if (post.comments.length > 0) {
                logger.info(`💭 Comentarios destacados:`);
                post.comments.slice(0, 3).forEach((comment, commentIndex) => {
                    logger.info(`  ${commentIndex + 1}. @${comment.username}: "${comment.text}" [${comment.sentiment}]`);
                });
            }
        });
        
        logger.info('\n✅ Prueba de análisis completada exitosamente!');
        
    } catch (error) {
        logger.error('❌ Error durante la prueba de análisis:', error);
        throw error;
    } finally {
        // Cerrar cliente
        await igClient.close();
        logger.info('🔒 Cliente de Instagram cerrado');
    }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
    testInstagramAnalysis()
        .then(() => {
            logger.info('🎉 Prueba completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('💥 Error en la prueba:', error);
            process.exit(1);
        });
}

export { testInstagramAnalysis };
