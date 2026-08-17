#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TARGET="$ROOT/opencats"
if [ -d "$TARGET/.git" ]; then
  echo "OpenCATS ja esta clonado. Atualizando..."
  git -C "$TARGET" pull
else
  rm -rf "$TARGET"
  echo "Clonando OpenCATS oficial..."
  git clone https://github.com/opencats/OpenCATS.git "$TARGET"
fi
printf '\nPronto.\nProximo passo:\n  cd "%s/docker"\n  docker compose up -d\n\n' "$TARGET"
echo "Prototipo visual: custom/careers/index.html"
