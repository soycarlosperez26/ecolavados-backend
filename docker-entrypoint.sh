#!/bin/sh
set -e

echo "📦 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

echo "🚀 Iniciando aplicación..."
exec node dist/src/main.js
