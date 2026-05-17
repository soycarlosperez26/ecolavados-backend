#!/bin/sh
set -e

echo "📦 Sincronizando schema con la base de datos..."
# db push es más flexible que migrate deploy (no requiere migration files)
npx prisma db push --skip-generate --accept-data-loss

echo "🚀 Iniciando aplicación..."
exec node dist/src/main.js
