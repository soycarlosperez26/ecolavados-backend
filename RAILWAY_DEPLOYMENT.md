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

## 🔧 Cómo Funciona el Despliegue

### Build Time (Railway construye la imagen Docker)
```
1. Descarga el código desde GitHub
2. npm ci → Instala dependencias
3. Crea un .env TEMPORAL con valores placeholder:
   DATABASE_URL="postgresql://dummy:dummy@localhost/dummy"
   DIRECT_URL="postgresql://dummy:dummy@localhost/dummy"
4. npx prisma generate → Genera Prisma Client (no valida BD)
5. npm run build → Compila TypeScript a JavaScript
6. ✅ Imagen Docker creada y lista
```

### Runtime (Railway ejecuta el contenedor)
```
1. Railway inyecta automáticamente TODAS las variables REALES:
   - DATABASE_URL ← Tu BD Postgres real
   - JWT_SECRET ← Tu secret real
   - SUPABASE_URL ← Tu URL Supabase real
   - Y todas las demás que configuraste en Railway
   
2. docker-entrypoint.sh ejecuta:
   - npx prisma migrate deploy → Aplica migraciones a la BD REAL
   - node dist/src/main.js → Inicia la aplicación
   
3. ✅ API disponible en https://tu-servicio-railway.com
```

## 📦 Dockerfile Optimizado

Multi-stage build para reducir tamaño final:

- **base**: Alpine Linux + Node.js 20 (pequeño)
- **deps**: Instala `node_modules`
- **builder**: Compila código + genera Prisma
- **runner**: Solo código compilado + node_modules (sin código fuente)

## 🔐 Variables de Entorno en Railway

**Flujo correcto:**

| Fase | Variables | Origen |
|------|-----------|--------|
| **Build** | DATABASE_URL="postgresql://dummy:dummy..." | Dockerfile (valores placeholder) |
| **Runtime** | DATABASE_URL="postgresql://postgres.xxxx..." | Panel Railway (valores reales) |

**Cómo configurarlas en Railway:**
1. Panel Railway → Tu servicio Node.js → **Variables**
2. Agrega todas tus variables:
   ```
   DATABASE_URL=postgresql://... (se auto-genera si vinculaste PostgreSQL)
   DIRECT_URL=postgresql://...
   JWT_SECRET=tu_secret_min_32_chars
   NODE_ENV=production
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=eyJ...
   etc.
   ```
3. Haz clic en **Deploy** (o push a main para auto-deploy)

**⚠️ Importante:** 
- `.env` NO se sube a git (está en `.gitignore`)
- En build time, Dockerfile crea uno temporal con valores dummy
- En runtime, Railway inyecta los valores reales automáticamente
- Tu código accede via `process.env.VARIABLE_NAME`

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

### ❌ Error: "prisma migrate deploy" falla al iniciar
**Causa:** La base de datos no está disponible o las variables de entorno no se pasaron correctamente.

**Checklist:**
1. ✅ ¿PostgreSQL está creado en Railway? (debe haber un servicio PostgreSQL)
2. ✅ ¿Está vinculado al servicio Node.js? (debe haber una línea conectando los servicios)
3. ✅ ¿Las variables `DATABASE_URL` y `DIRECT_URL` existen en Variables?
4. ✅ ¿Has hecho re-deploy después de agregar PostgreSQL?

**Solución paso a paso:**
```bash
# 1. Verifica que PostgreSQL esté corriendo
railway run psql $DATABASE_URL -c "SELECT 1"

# 2. Si eso funciona, verifica migraciones
railway run npx prisma migrate status

# 3. Si aún falla, reinicia el servicio Node.js en Railway UI
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
