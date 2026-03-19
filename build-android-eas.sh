# Script para build EAS Android
# Execute este script após o reset do limite de builds (a partir de 1 de abril de 2026)

cd mobile
npx eas-cli build --platform android
