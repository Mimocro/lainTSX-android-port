#!/bin/sh
set -e

ASSETS=/app/src/main/assets/www
rm -rf "$ASSETS"
mkdir -p "$ASSETS"
cp -r /www/. "$ASSETS"/
cp -r /app/www "$ASSETS"/mobile
sed -i 's#</head>#<link rel="stylesheet" href="/mobile/touch.css"><script src="/mobile/touch.js" defer></script></head>#' "$ASSETS"/game.html

mkdir -p /app/src/main/res/mipmap
cp /www/images/icon.png /app/src/main/res/mipmap/ic_launcher.png

gradle --no-daemon assembleDebug
cp build/outputs/apk/debug/*.apk /out/lainTSX.apk
echo "Done: out/lainTSX.apk"
