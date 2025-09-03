# 🚀 Pisa Suave 2.0 - Analizador Automatizado de Instagram

## 📋 Descripción General

Pisa Suave 2.0 es una extensión del repositorio Instagram-AI-Agent que proporciona análisis automatizado de posts de Instagram, extrayendo métricas de engagement, analizando comentarios y generando informes estructurados usando IA.

## 🎯 Funcionalidades Principales

### ✅ Datos Extraídos por Post
- **Información básica**: ID del post, fecha, tipo de contenido
- **Métricas**: Cantidad exacta de likes
- **Tipo de contenido**: Imagen simple, carrusel (múltiples imágenes), o video
- **Caption completo**: Texto de la publicación
- **Muestra de comentarios**: Máximo 10 comentarios representativos
- **Hashtags y menciones**: Extracción automática de #hashtags y @usuarios

### 🔍 Análisis de Comentarios
- **Username y texto**: Extracción completa de comentarios
- **Análisis de sentiment**: Clasificación positiva/negativa/neutra usando palabras clave
- **Priorización inteligente**: Comentarios con más interacción
- **Filtrado de spam**: Eliminación de comentarios muy cortos (< 5 caracteres)

### 📊 Métricas de Engagement
- **Cálculo de engagement**: Basado en likes + comentarios
- **Resumen estadístico**: Totales, promedios y breakdowns
- **Análisis temporal**: Filtrado por períodos específicos (días hacia atrás)

## 🛠️ Implementación Técnica

### Arquitectura del Método Principal

```typescript
async scrapeInstagramAnalysis(
    username: string, 
    options: ScrapingOptions = {}
): Promise<InstagramAnalysisData>
```

### Flujo de Ejecución

1. **Validación del perfil** - Verificar existencia y visibilidad
2. **Obtención de posts** - Extraer URLs de posts recientes
3. **Filtrado por fecha** - Solo posts del período especificado
4. **Procesamiento individual** - Navegar y extraer datos de cada post
5. **Análisis agregado** - Generar resumen y métricas

### Manejo de Errores

- **Try-catch por post individual** - Continuar si uno falla
- **Logging detallado** - Registro de errores y éxitos
- **Fallbacks robustos** - Múltiples selectores para elementos críticos
- **Rate limiting** - 2-4 segundos entre requests

## 📁 Estructura de Archivos

```
src/
├── types/
│   └── instagram.ts          # Interfaces TypeScript
├── client/
│   ├── IG-bot/
│   │   └── IgClient.ts       # Clase principal extendida
│   └── Instagram.ts          # Helpers y exports
└── scripts/
    ├── testInstagramAnalysis.ts  # Script de prueba
    └── exampleUsage.ts           # Ejemplos de uso
```

## 🚀 Uso Básico

### Inicialización

```typescript
import { IgClient } from './src/client/IG-bot/IgClient';

const igClient = new IgClient();
await igClient.init();
```

### Análisis Básico

```typescript
const analysisData = await igClient.scrapeInstagramAnalysis('inducascos', {
    daysBack: 30,        // Últimos 30 días
    maxPosts: 25,        // Máximo 25 posts
    maxCommentsPerPost: 10, // 10 comentarios por post
    rateLimitMs: 3000    // 3 segundos entre posts
});
```

### Uso con Helper

```typescript
import { analyzeInstagramProfile } from './src/client/Instagram';

const data = await analyzeInstagramProfile('inducascos', {
    daysBack: 7,
    maxPosts: 15
});
```

## 📊 Estructura de Datos

### PostData
```typescript
interface PostData {
    id: string;
    url: string;
    date: string;
    type: 'image' | 'carousel' | 'video';
    caption: string;
    likes: number;
    comments: CommentData[];
    engagement: number;
    hashtags: string[];
    mentions: string[];
    mediaUrls?: string[];
}
```

### InstagramAnalysisData
```typescript
interface InstagramAnalysisData {
    username: string;
    analysisDate: string;
    period: string;
    totalPosts: number;
    posts: PostData[];
    summary: {
        totalLikes: number;
        totalComments: number;
        averageEngagement: number;
        mostEngagedPost?: PostData;
        contentTypeBreakdown: {
            images: number;
            carousels: number;
            videos: number;
        };
        sentimentBreakdown: {
            positive: number;
            negative: number;
            neutral: number;
        };
    };
}
```

## 🧪 Testing y Validación

### Script de Prueba

```bash
# Ejecutar prueba básica
npx ts-node src/scripts/testInstagramAnalysis.ts

# Ejecutar ejemplos de uso
npx ts-node src/scripts/exampleUsage.ts
```

### Casos de Prueba

- **Perfil público**: @inducascos (5 posts)
- **Validación de tipos**: Imagen, carrusel, video
- **Análisis de sentiment**: Comentarios en español
- **Rate limiting**: Verificación de delays
- **Manejo de errores**: Posts con problemas

## 🔒 Consideraciones de Seguridad

### Rate Limiting
- **Delays configurables**: 2-4 segundos entre requests
- **Headers realistas**: User-agent y configuración de navegador
- **Anti-bot detection**: Uso de StealthPlugin de Puppeteer

### Límites de Instagram
- **Posts por sesión**: Máximo 50 posts por análisis
- **Comentarios por post**: Máximo 10 comentarios
- **Tiempo entre requests**: Mínimo 2 segundos

## 🚀 Optimizaciones Implementadas

### Detección de Contenido
- **Múltiples selectores**: Fallbacks para cambios de Instagram
- **Detección inteligente**: Carrusel, video, imagen
- **Extracción robusta**: Captions, likes, comentarios

### Análisis de Sentiment
- **Palabras clave en español**: Adaptado al mercado latino
- **Clasificación inteligente**: Positivo/negativo/neutro
- **Filtrado de ruido**: Comentarios muy cortos o spam

### Performance
- **Scroll inteligente**: Carga progresiva de posts
- **Procesamiento paralelo**: Múltiples posts simultáneos
- **Cache de sesión**: Reutilización de login

## 📈 Casos de Uso

### 1. Análisis de Competencia
```typescript
// Analizar posts de competidores
const competitorAnalysis = await analyzeInstagramProfile('competidor', {
    daysBack: 7,
    maxPosts: 20
});
```

### 2. Monitoreo de Campañas
```typescript
// Seguimiento semanal de engagement
const weeklyReport = await analyzeInstagramProfile('miempresa', {
    daysBack: 7,
    maxPosts: 15,
    includeMediaUrls: true
});
```

### 3. Análisis de Hashtags
```typescript
// Identificar hashtags populares
const hashtagAnalysis = await analyzeInstagramProfile('influencer', {
    daysBack: 30,
    maxPosts: 30
});

const popularHashtags = hashtagAnalysis.posts
    .flatMap(post => post.hashtags)
    .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});
```

## 🔧 Configuración Avanzada

### Opciones de Scraping

```typescript
interface ScrapingOptions {
    daysBack?: number;           // Días hacia atrás (default: 30)
    maxPosts?: number;           // Máximo posts a analizar (default: 50)
    maxCommentsPerPost?: number; // Comentarios por post (default: 10)
    includeMediaUrls?: boolean;  // Incluir URLs de media (default: false)
    rateLimitMs?: number;        // Delay entre requests (default: 3000)
}
```

### Personalización de Selectores

```typescript
// En scrapeIndividualPost, modificar selectores según cambios de Instagram
const likesSelectors = [
    'section button span[title]',
    'a[href*="/liked_by/"] span',
    '[data-testid="like-count"]',
    // Agregar nuevos selectores aquí
];
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **"Page not initialized"**
   - Verificar que `igClient.init()` se ejecutó correctamente
   - Revisar credenciales de Instagram

2. **"Perfil privado"**
   - Solo se pueden analizar perfiles públicos
   - Verificar que el username sea correcto

3. **Selectores no funcionan**
   - Instagram cambia su DOM frecuentemente
   - Actualizar selectores en `scrapeIndividualPost`

4. **Rate limiting excesivo**
   - Aumentar `rateLimitMs` en las opciones
   - Reducir `maxPosts` por sesión

### Logs y Debugging

```typescript
// Habilitar logging detallado
import logger from './src/config/logger';
logger.level = 'debug';

// Verificar estado del cliente
console.log('Browser:', !!igClient.browser);
console.log('Page:', !!igClient.page);
```

## 🚀 Roadmap Futuro

### Próximas Funcionalidades
- **Análisis de Stories**: Captura de métricas de Stories
- **Análisis de Reels**: Métricas específicas de video corto
- **Export a CSV/JSON**: Generación de reportes
- **Dashboard web**: Interfaz visual para análisis
- **Alertas automáticas**: Notificaciones de cambios importantes

### Mejoras Técnicas
- **Machine Learning**: Análisis de sentiment más avanzado
- **Cache distribuido**: Redis para múltiples sesiones
- **API REST**: Endpoints para integración externa
- **Webhooks**: Notificaciones en tiempo real

## 📞 Soporte y Contribución

### Reportar Issues
- Crear issue en GitHub con detalles del problema
- Incluir logs de error y pasos para reproducir
- Especificar versión de Instagram y configuración

### Contribuir
- Fork del repositorio
- Crear branch para nueva funcionalidad
- Tests y documentación incluidos
- Pull request con descripción detallada

---

**Pisa Suave 2.0** - Transformando el análisis de Instagram con IA 🤖✨
