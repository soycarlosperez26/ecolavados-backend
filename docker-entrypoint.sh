#!/bin/sh
set -e

echo "🔄 Esperando que la base de datos esté lista..."

# Esperar a que la BD esté disponible (máx 30 segundos)
MAX_ATTEMPTS=30
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  if npx prisma db push --skip-generate --skip-validate 2>/dev/null || \
     npx prisma migrate deploy 2>/dev/null; then
    echo "✅ Base de datos lista"
    break
  fi

  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Base de datos no disponible después de $MAX_ATTEMPTS intentos"
    exit 1
  fi

  echo "⏳ Intento $ATTEMPT/$MAX_ATTEMPTS fallido, esperando 1s..."
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

echo "🚀 Iniciando aplicación..."
exec node dist/src/main.js
