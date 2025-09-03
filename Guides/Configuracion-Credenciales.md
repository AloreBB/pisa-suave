# 🔐 Configuración de Credenciales - Pisa Suave 2.0

## 📋 **Credenciales Requeridas**

Para que Pisa Suave 2.0 funcione correctamente, necesitas configurar tus credenciales de Instagram.

## 🚀 **Método 1: Archivo .env (Recomendado)**

### **Paso 1: Crear archivo .env**
En la raíz de tu proyecto, crea un archivo llamado `.env`:

```bash
# En la raíz del proyecto
touch .env
```

### **Paso 2: Agregar credenciales**
Abre el archivo `.env` y agrega tus credenciales:

```env
# Instagram Credentials
IGusername=tu_usuario_de_instagram
IGpassword=tu_contraseña_de_instagram

# Ejemplo:
IGusername=juan_perez
IGpassword=MiContraseña123!
```

### **Paso 3: Verificar configuración**
Ejecuta el script de verificación:

```bash
npm run check:credentials
```

## 🔧 **Método 2: Variables de Entorno del Sistema**

### **macOS/Linux**
```bash
export IGusername="tu_usuario_de_instagram"
export IGpassword="tu_contraseña_de_instagram"
```

### **Windows PowerShell**
```powershell
$env:IGusername="tu_usuario_de_instagram"
$env:IGpassword="tu_contraseña_de_instagram"
```

### **Windows CMD**
```cmd
set IGusername=tu_usuario_de_instagram
set IGpassword=tu_contraseña_de_instagram
```

## ✅ **Verificación de Configuración**

### **Script de Verificación**
```bash
npm run check:credentials
```

**Salida esperada si está bien configurado:**
```
🔐 Verificando credenciales de Instagram...
✅ Username cargado: juan_perez
✅ Password cargado: ********
🎉 ¡Credenciales de Instagram configuradas correctamente!
🚀 Puedes ejecutar el análisis de Instagram ahora
```

**Salida si hay problemas:**
```
🔐 Verificando credenciales de Instagram...
⚠️  Username no configurado o usando valor por defecto
⚠️  Password no configurado o usando valor por defecto
❌ Credenciales de Instagram no configuradas correctamente
```

## 🚨 **Problemas Comunes y Soluciones**

### **1. "Credenciales no configuradas"**
**Causa:** Variables de entorno no están cargadas
**Solución:**
```bash
# Verificar que el archivo .env existe
ls -la .env

# Verificar contenido (sin mostrar password)
cat .env | grep IGusername
```

### **2. "Valor por defecto detectado"**
**Causa:** Las variables están usando valores fallback
**Solución:**
```bash
# Verificar variables de entorno
echo $IGusername
echo $IGpassword

# Si están vacías, recargar .env
source .env
```

### **3. "Error de autenticación en Instagram"**
**Causa:** Credenciales incorrectas o cuenta bloqueada
**Solución:**
- Verificar username y password
- Comprobar que la cuenta no esté bloqueada
- Usar credenciales de una cuenta secundaria para testing

## 🔒 **Seguridad y Mejores Prácticas**

### **✅ HACER:**
- Usar archivo `.env` (ya está en `.gitignore`)
- Usar contraseñas fuertes
- Cambiar credenciales regularmente
- Usar cuenta secundaria para testing

### **❌ NO HACER:**
- Subir credenciales al repositorio
- Compartir archivo `.env`
- Usar credenciales en código hardcodeado
- Usar cuenta principal para testing

## 🧪 **Testing de Credenciales**

### **Script de Prueba Completa**
```bash
# 1. Verificar credenciales
npm run check:credentials

# 2. Si están bien, probar análisis
npm run test:instagram

# 3. Ejemplos de uso
npm run example:instagram
```

## 📱 **Configuración de Cuenta de Instagram**

### **Recomendaciones para la Cuenta:**
1. **Cuenta secundaria:** Usar cuenta de testing, no la principal
2. **Verificación en dos pasos:** Deshabilitar temporalmente si causa problemas
3. **Actividad normal:** Usar la cuenta regularmente para evitar flags
4. **Email válido:** Mantener email de recuperación actualizado

### **Configuración de Privacidad:**
- **Perfil público:** Para análisis de otros usuarios
- **Notificaciones:** Deshabilitar notificaciones de login
- **Actividad:** Mantener actividad normal

## 🔄 **Actualización de Credenciales**

### **Cambiar Username**
```bash
# Editar archivo .env
nano .env

# Cambiar línea:
IGusername=nuevo_usuario

# Verificar cambio
npm run check:credentials
```

### **Cambiar Password**
```bash
# Editar archivo .env
nano .env

# Cambiar línea:
IGpassword=nueva_contraseña

# Verificar cambio
npm run check:credentials
```

## 📞 **Soporte y Troubleshooting**

### **Si las credenciales no funcionan:**
1. Verificar que Instagram no haya bloqueado la cuenta
2. Comprobar que no haya verificación en dos pasos activa
3. Intentar login manual en Instagram.com
4. Usar cuenta secundaria para testing

### **Logs de Error:**
```bash
# Habilitar logging detallado
export DEBUG=*
npm run test:instagram
```

## 🎯 **Próximos Pasos**

Una vez configuradas las credenciales:

1. **✅ Verificar configuración:** `npm run check:credentials`
2. **🧪 Ejecutar prueba:** `npm run test:instagram`
3. **📊 Analizar perfil real:** Modificar script con username deseado
4. **🚀 Usar en producción:** Integrar en tu aplicación

---

**¡Con las credenciales configuradas, Pisa Suave 2.0 está listo para analizar Instagram! 🎉**
