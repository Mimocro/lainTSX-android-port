#!/bin/sh
set -e

if [ -f /www/game.html ]; then
    echo "Assets already extracted, skipping (docker compose down -v to redo)."
    exit 0
fi

for d in disk1 disk2; do
    if [ ! -f /disks/$d.bin ]; then
        echo "Missing disks/$d.bin" >&2
        exit 1
    fi
done

cd /src/scripts
node extract.mjs
cd /src
npm run build
cp -r dist/. /www/
