#!/bin/bash

# ========================================
# 🚀 PISA SUAVE 2.0 - SETUP RÁPIDO
# ========================================
# Script para configurar rápidamente las variables de entorno

echo "🎯 Configurando Pisa Suave 2.0..."

# Verificar si existe el archivo env.example
if [ ! -f "env.example" ]; then
    echo "❌ Error: No se encontró el archivo env.example"
    echo "💡 Asegúrate de estar en la raíz del proyecto"
    exit 1
fi

# Verificar si ya existe .env
if [ -f ".env" ]; then
    echo "⚠️  El archivo .env ya existe"
    read -p "¿Quieres sobrescribirlo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuración cancelada"
        exit 0
    fi
fi

# Copiar archivo de ejemplo
cp env.example .env
echo "✅ Archivo .env creado desde env.example"

# Solicitar credenciales de Instagram
echo ""
echo "🔐 CONFIGURACIÓN DE INSTAGRAM"
echo "=============================="

read -p "Usuario de Instagram: " ig_username
read -s -p "Contraseña de Instagram: " ig_password
echo ""

# Solicitar API key de Gemini (opcional)
echo ""
echo "🤖 CONFIGURACIÓN DE GEMINI AI (OPCIONAL)"
echo "========================================="
read -p "API Key de Gemini (Enter para omitir): " gemini_key

# Actualizar archivo .env
if [ ! -z "$ig_username" ]; then
    sed -i.bak "s/IGusername=tu_usuario_de_instagram/IGusername=$ig_username/" .env
fi

if [ ! -z "$ig_password" ]; then
    sed -i.bak "s/IGpassword=tu_contraseña_de_instagram/IGpassword=$ig_password/" .env
fi

if [ ! -z "$gemini_key" ]; then
    sed -i.bak "s/GEMINI_API_KEY_1=tu_gemini_api_key_1/GEMINI_API_KEY_1=$gemini_key/" .env
fi

# Limpiar archivo de backup
rm -f .env.bak

echo ""
echo "🎉 ¡Configuración completada!"
echo "=============================="
echo "✅ Archivo .env configurado"
echo "✅ Credenciales de Instagram agregadas"

if [ ! -z "$gemini_key" ]; then
    echo "✅ API Key de Gemini configurada"
fi

echo ""
echo "🔍 Verificar configuración:"
echo "npm run check:credentials"
echo ""
echo "🧪 Probar análisis de Instagram:"
echo "npm run test:instagram"
echo ""
echo "📚 Ver ejemplos de uso:"
echo "npm run example:instagram"
