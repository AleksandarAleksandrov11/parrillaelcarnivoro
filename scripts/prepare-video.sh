#!/usr/bin/env bash
# Prepara los vídeos de la web a partir de source-assets/.
#  - Hero: vídeo de Pexels (Denys Gromov, licencia Pexels) de carne en la parrilla.
# Salida: public/video/*.mp4 (H.264) y *.webm (AV1), sin audio y en bucle sin corte,
# más los pósters en src/assets/photos/ (los procesa astro:assets a AVIF/WebP).
#
# Requiere ffmpeg con libx264 y libsvtav1. Uso: npm run assets:video
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/source-assets/wp-uploads"
OUT="$ROOT/public/video"
POSTERS="$ROOT/src/assets/photos"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT" "$POSTERS"

# Bucle sin corte: el último segundo se funde con el primero.
#   $1 entrada  $2 inicio(s)  $3 duración(s)  $4 filtro de escala/recorte  $5 salida (sin extensión)
make_loop() {
  local in="$1" start="$2" dur="$3" vf="$4" out="$5"
  local fade=1
  local offset
  offset=$(python3 -c "print(round($dur - 2*$fade, 3))")
  # Master intermedio sin pérdidas visibles
  ffmpeg -v error -y -ss "$start" -t "$dur" -i "$in" -an \
    -filter_complex "[0:v]${vf},setsar=1,format=yuv420p,split[a][b];[a]trim=start=${fade},setpts=PTS-STARTPTS[main];[b]trim=end=${fade},setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=${fade}:offset=${offset},format=yuv420p[v]" \
    -map "[v]" -c:v libx264 -crf 12 -preset medium "$TMP/$(basename "$out").master.mp4"
}

encode() {
  local master="$1" name="$2" crf264="$3" crfav1="$4"
  ffmpeg -v error -y -i "$master" -an -c:v libx264 -preset veryslow -tune film -crf "$crf264" \
    -profile:v high -pix_fmt yuv420p -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -v error -y -i "$master" -an -c:v libsvtav1 -preset 4 -crf "$crfav1" \
    -svtav1-params tune=0 -pix_fmt yuv420p "$OUT/$name.webm"
}

poster() {
  local master="$1" dest="$2"
  ffmpeg -v error -y -i "$master" -frames:v 1 -q:v 2 "$dest"
}

HERO="$SRC/2023/03/pexels-denys-gromov-6577409.mp4"

echo "→ Hero 1080p / 720p / vertical"
make_loop "$HERO" 0 9.9 "scale=1920:1080:flags=lanczos" hero-1080
make_loop "$HERO" 0 9.9 "scale=1280:720:flags=lanczos" hero-720
# Recorte vertical nativo (sin reescalar) centrado en la carne y la llama.
make_loop "$HERO" 0 9.9 "crop=608:1080:520:0" hero-portrait

encode "$TMP/hero-1080.master.mp4" hero-1080 27 40
encode "$TMP/hero-720.master.mp4" hero-720 28 41
encode "$TMP/hero-portrait.master.mp4" hero-portrait 27 40

poster "$TMP/hero-1080.master.mp4" "$POSTERS/hero-parrilla-carbon-poster.jpg"
poster "$TMP/hero-portrait.master.mp4" "$POSTERS/hero-parrilla-carbon-poster-vertical.jpg"

ls -la "$OUT"
