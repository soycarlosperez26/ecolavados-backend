# 🚀 Guía de Despliegue en Railway

Este proyecto está configurado para desplegarse automáticamente en [Railway](https://railway.app).

## Prerequisitos

- Cuenta en Railway
- Proyecto conectado a GitHub
- Postgres database (Railway lo crea automáticamente)
- Redis (opcional, para jobs)

## Pasos de Despliegue

### 1. **Conectar Repositorio**
   - Inicia sesión en [railway.app](https://railway.app)
   - Crea un nuevo proyecto
   - Conecta tu repositorio de GitHub
   - Autoriza el acceso de Railway a tu repositorio

### 2. **Crear Servicios**
Railway detectará automáticamente que es un proyecto Node.js. Necesitas agregar:

- **Node.js App** (detectado automáticamente)
- **PostgreSQL Database** (agregar manualmente)
- **Redis** (opcional, para BullMQ)

### 3. **Variables de Entorno**
Railway necesita estas variables para funcionar. Agrégalas en el panel de Railway:

```
# Database (Railway proporciona automáticamente la URL)
DATABASE_URL=postgres://...
DIRECT_URL=postgresql://...

# Supabase
SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_STORAGE_BUCKET="evidences"

# JWT
JWT_SECRET="CHANGE_THIS_SECRET_MIN_32_CHARS_LONG"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="CHANGE_THIS_REFRESH_SECRET_MIN_32"
JWT_REFRESH_EXPIRES_IN="7d"

# App
NODE_ENV="production"
CORS_ORIGIN="https://tu-dominio.com"

# Redis (si usas BullMQ)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=0

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_VISION_MODEL="gpt-4-turbo"
AI_MOCK_MODE=false
AI_MAX_IMAGES_PER_JOB=12
AI_MIN_IMAGES_REQUIRED=3
```

### 4. **Conectar PostgreSQL**
   - En Railway, agrega un servicio PostgreSQL
   - Vincula la base de datos al servicio Node.js
   - Las variables `DATABASE_URL` y `DIRECT_URL` se generarán automáticamente

### 5. **Despliegue Automático**
   - Railway automáticamente:
     - Descarga el código
     - Instala dependencias con `npm ci`
     - Ejecuta las migraciones de Prisma (`prisma migrate deploy`)
     - Compila el proyecto (`npm run build`)
     - Inicia la aplicación

## Dockerfile

El Dockerfile ya está optimizado para Railway:

```dockerfile
# Multi-stage build para reducir tamaño
- Base: Alpine Linux + Node.js 20
- Deps: Instala dependencias
- Builder: Compila el código y genera Prisma
- Runner: Imagen final con solo lo necesario
```

**Comandos ejecutados:**
1. `npx prisma migrate deploy` - Aplica migraciones pendientes
2. `node dist/src/main.js` - Inicia la aplicación

## Variables de Entorno Automáticas

Railway proporciona automáticamente:

- `PORT` - Puerto asignado dinámicamente (por defecto 3000)
- `DATABASE_URL` - URL de conexión a Postgres

## Health Check

Tu aplicación está configurada para:
- Escuchar en `0.0.0.0:$PORT`
- Loguear cuando está lista: `🚀 API running on port 3000`
- Servir Swagger docs en `/api/docs` (solo en desarrollo)

## Monitoreo

En el panel de Railway puedes:
- Ver logs en tiempo real
- Monitorear CPU, memoria y red
- Configurar alertas
- Escalar automáticamente

## Troubleshooting

### ❌ Error: "Could not parse schema engine response: SyntaxError"
**Causa:** Prisma intenta conectarse a la BD antes de que esté lista.

**Solución:**
- El archivo `docker-entrypoint.sh` ya maneja esto automáticamente con reintentos
- Asegúrate de que las variables `DATABASE_URL` y `DIRECT_URL` están configuradas en Railway
- Verifica que el servicio PostgreSQL esté vinculado al servicio Node.js

**Si sigue fallando:**
```bash
# En los logs de Railway, busca:
railway run npx prisma db push --skip-generate
railway run npx prisma migrate status
```

### Migraciones fallidas
Si las migraciones falla después del entrypoint:
```bash
# Verifica el estado de migraciones
railway run npx prisma migrate status

# O usa db push (crea migraciones automáticamente)
railway run npx prisma db push
```

### Variables de entorno no cargadas
**Síntomas:** Error de conexión a BD o Supabase no disponible

**Solución:**
- Verifica en Railway → Variable Explorer que todas las variables estén ahí
- No uses `.env` en producción, configúralas SIEMPRE en Railway UI
- Si cambias variables, re-deploy la aplicación

**Variables críticas que DEBEN estar:**
```
DATABASE_URL        ← Generada automáticamente por Railway Postgres
DIRECT_URL          ← Para migraciones (usa pooler:6543 para queries normales)
SUPABASE_URL        ← Para almacenamiento de archivos
SUPABASE_ANON_KEY   ← Para autenticación
JWT_SECRET          ← Mínimo 32 caracteres
```

### Puerto rechazado
- Railway asigna el puerto automáticamente via `$PORT`
- La aplicación ya está configurada para usarlo
- Los logs deberían mostrar: `🚀 API running on port 3000`

### Base de datos no conecta
**Verificación:**
1. ¿El servicio PostgreSQL está creado en Railway? (debería estar)
2. ¿Está vinculado al servicio Node.js? (debe haber una línea de conexión)
3. ¿Las variables `DATABASE_URL` y `DIRECT_URL` existen?

**Solución:**
```bash
# En Railway, ejecuta:
railway run psql $DATABASE_URL -c "SELECT 1"

# Si devuelve error, la BD no está lista
# Si devuelve (1), está conectada correctamente
```

## Dominios Personalizados

En Railway puedes:
1. Ir a Networking
2. Agregar un dominio personalizado
3. Apuntar tu DNS al dominio de Railway

## Escala y Rendimiento

Recomendaciones:
- **RAM**: Mínimo 512MB (recomendado 1GB)
- **CPU**: Shared es suficiente para desarrollo
- **Auto-scale**: Configurable en Railway Pro

---

Para más información, visita la [documentación de Railway](https://docs.railway.app).
