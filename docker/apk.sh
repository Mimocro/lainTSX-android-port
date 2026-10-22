#!/bin/sh
set -e

ASSETS=/app/src/main/assets/www
rm -rf "$ASSETS"
mkdir -p "$ASSETS"
cp -r /www/. "$ASSETS"/
cp -r /app/www "$ASSETS"/mobile
sed -i 's#</head>#<link rel="stylesheet" href="/mobile/touch.css"><script src="/mobile/touch.js" defer></script></head>#' "$ASSETS"/game.html

gradle --no-daemon assembleDebug
cp build/outputs/apk/debug/app-debug.apk /out/lain.apk
echo "Done: out/lain.apk"
