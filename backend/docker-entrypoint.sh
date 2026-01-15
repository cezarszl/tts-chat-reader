#!/bin/bash
set -e

TARGET_DIR="/data/whatsapp/session/"

if [ -d "$TARGET_DIR" ]; then
    find "$TARGET_DIR" -name "SingletonLock" -delete -print
    find "$TARGET_DIR" -name "SingletonCookie" -delete -print
    find "$TARGET_DIR" -name "SingletonSocket" -type s -delete -print    
fi

exec "$@"