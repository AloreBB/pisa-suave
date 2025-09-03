import { analyzeInstagramProfile } from '../client/Instagram';
import logger from '../config/logger';

/**
 * Ejemplo de uso de la funcionalidad de análisis de Instagram
 * Demuestra cómo usar el nuevo método scrapeInstagramAnalysis
 */
async function exampleUsage() {
    try {
        logger.info('🎯 Ejemplo de uso de Pisa Suave 2.0 - Análisis de Instagram');
        
        // Ejemplo 1: Análisis básico (últimos 30 días, máximo 10 posts)
        logger.info('\n📊 Ejemplo 1: Análisis básico');
        const basicAnalysis = await analyzeInstagramProfile('inducascos', {
            daysBack: 30,
            maxPosts: 10,
            maxCommentsPerPost: 5
        });
        
        logger.info(`✅ Análisis completado para @${basicAnalysis.username}`);
        logger.info(`📝 Posts analizados: ${basicAnalysis.totalPosts}`);
        logger.info(`❤️ Total de likes: ${basicAnalysis.summary.totalLikes}`);
        logger.info(`💬 Total de comentarios: ${basicAnalysis.summary.totalComments}`);
        
        // Ejemplo 2: Análisis detallado con más opciones
        logger.info('\n🔍 Ejemplo 2: Análisis detallado');
        const detailedAnalysis = await analyzeInstagramProfile('inducascos', {
            daysBack: 7,           // Solo última semana
            maxPosts: 25,          // Más posts
            maxCommentsPerPost: 10, // Más comentarios por post
            includeMediaUrls: true, // Incluir URLs de media
            rateLimitMs: 5000      // Rate limiting más conservador
        });
        
        logger.info(`✅ Análisis detallado completado`);
        logger.info(`📊 Engagement promedio: ${detailedAnalysis.summary.averageEngagement}`);
        
        // Mostrar breakdown de tipos de contenido
        const { contentTypeBreakdown } = detailedAnalysis.summary;
        logger.info(`🎨 Tipos de contenido:`);
        logger.info(`  🖼️ Imágenes: ${contentTypeBreakdown.images}`);
        logger.info(`  🔄 Carruseles: ${contentTypeBreakdown.carousels}`);
        logger.info(`  🎥 Videos: ${contentTypeBreakdown.videos}`);
        
        // Mostrar breakdown de sentiment
        const { sentimentBreakdown } = detailedAnalysis.summary;
        logger.info(`😊 Análisis de sentiment:`);
        logger.info(`  😍 Positivos: ${sentimentBreakdown.positive}`);
        logger.info(`  😞 Negativos: ${sentimentBreakdown.negative}`);
        logger.info(`  😐 Neutros: ${sentimentBreakdown.neutral}`);
        
        // Ejemplo 3: Análisis de hashtags populares
        logger.info('\n🏷️ Ejemplo 3: Análisis de hashtags populares');
        const allHashtags = detailedAnalysis.posts.flatMap(post => post.hashtags);
        const hashtagCounts = allHashtags.reduce((acc, hashtag) => {
            acc[hashtag] = (acc[hashtag] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const topHashtags = Object.entries(hashtagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        logger.info('🏆 Top 5 hashtags más usados:');
        topHashtags.forEach(([hashtag, count], index) => {
            logger.info(`  ${index + 1}. #${hashtag}: ${count} veces`);
        });
        
        logger.info('\n🎉 Ejemplos de uso completados exitosamente!');
        
    } catch (error) {
        logger.error('❌ Error en los ejemplos de uso:', error);
        throw error;
    }
}

// Ejecutar ejemplo si se llama directamente
if (require.main === module) {
    exampleUsage()
        .then(() => {
            logger.info('✅ Ejemplos ejecutados correctamente');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('💥 Error ejecutando ejemplos:', error);
            process.exit(1);
        });
}

export { exampleUsage };
