#!/bin/sh
set -e

echo "🔨 Generando Prisma Client con variables reales..."
npx prisma generate

echo "📦 Sincronizando schema con la base de datos..."
npx prisma db push --skip-generate --accept-data-loss

echo "🚀 Iniciando aplicación..."
exec node dist/src/main.js
