#!/bin/sh
set -e

echo "📦 Aplicando migraciones..."
npx prisma db push --skip-generate --accept-data-loss

echo "🚀 Iniciando aplicación..."
exec node dist/src/main.js
