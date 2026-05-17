#!/bin/sh
set -e

# Verify required env vars are present
echo "🔍 Verificando variables de entorno..."
MISSING=""

[ -z "$DATABASE_URL" ] && MISSING="$MISSING DATABASE_URL"
[ -z "$DIRECT_URL" ]   && MISSING="$MISSING DIRECT_URL"
[ -z "$JWT_SECRET" ]   && MISSING="$MISSING JWT_SECRET"

if [ -n "$MISSING" ]; then
  echo "❌ Variables de entorno faltantes:$MISSING"
  echo "   Configúralas en Railway → tu servicio → Variables"
  exit 1
fi

echo "✅ Variables de entorno presentes"
echo "   DATABASE_URL=${DATABASE_URL%%@*}@***"

echo "📦 Aplicando schema a la base de datos..."
if ! npx prisma db push --skip-generate --accept-data-loss; then
  echo ""
  echo "❌ prisma db push falló. Posibles causas:"
  echo "   1. DATABASE_URL incorrecta o inaccesible"
  echo "   2. La base de datos no está disponible"
  echo "   3. Credenciales incorrectas"
  echo ""
  echo "   DATABASE_URL (sin password): ${DATABASE_URL%%@*}@***"
  exit 1
fi

echo "🚀 Iniciando aplicación..."
exec node dist/src/main.js
