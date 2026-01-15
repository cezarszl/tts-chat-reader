#!/bin/bash
set -e

TARGET_DIR="/data/whatsapp/session/"

echo "🧹 [Entrypoint] Sprawdzam blokady Chromium w: $TARGET_DIR"

if [ -d "$TARGET_DIR" ]; then
    find "$TARGET_DIR" -name "SingletonLock" -delete -print
    find "$TARGET_DIR" -name "SingletonCookie" -delete -print
    find "$TARGET_DIR" -name "SingletonSocket" -type s -delete -print
    
    echo "✅ [Entrypoint] Czyszczenie zakończone."
else
    echo "⚠️ [Entrypoint] Katalog $TARGET_DIR nie istnieje. Pomijam czyszczenie."
fi

exec "$@"