#!/usr/bin/env bash
# Graba el archivo .env de la app sin tener que editarlo a mano.
# Genera AUTH_SECRET automáticamente y te pide el resto de los datos.
# Uso (desde la raíz del proyecto en el server):
#   bash scripts/setup-env.sh
set -euo pipefail

if [ -f .env ]; then
  read -p ".env ya existe. ¿Sobreescribir? (s/N): " OW
  [[ "${OW:-}" =~ ^[sS]$ ]] || { echo "Cancelado."; exit 0; }
fi

echo "== Configuración del .env =="
read -p "Dominio (ej: kairosapp.com.ar): " DOMAIN
read -p "Puerto de la app (ej: 3012): " APP_PORT
read -p "Puerto de la DB en el host (ej: 5441): " DB_PORT
read -p "Usuario de la DB (ej: kairos_user): " DB_USER
read -p "Password de la DB: " DB_PASS
read -p "Nombre de la DB (ej: kairos_db): " DB_NAME
read -p "Google Client ID: " GID
read -p "Google Client Secret: " GSECRET

AUTH_SECRET="$(openssl rand -base64 32)"

cat > .env <<EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}?schema=public"
AUTH_SECRET="${AUTH_SECRET}"
AUTH_URL="https://${DOMAIN}"
NEXTAUTH_URL="https://${DOMAIN}"
GOOGLE_CLIENT_ID="${GID}"
GOOGLE_CLIENT_SECRET="${GSECRET}"
PORT=${APP_PORT}
EOF

echo ""
echo "✅ .env creado. AUTH_SECRET se generó automáticamente."
echo "   Claves guardadas:"
sed -E 's/=.*/=***/' .env
