# source-assets — originales (fuera del build)

Material original descargado de la web anterior (copia de seguridad de WordPress, noviembre 2026)
y de la nueva carta. **No se publica tal cual**: los scripts de `scripts/` generan desde aquí las
versiones optimizadas que usa la web.

| Carpeta / archivo | Contenido | Uso |
|---|---|---|
| `carta-pdf/carta-2026-para-aprobar.pdf` | Carta nueva (4 páginas, imagen) | Fuente de verdad de `src/data/carta.ts` |
| `wp-uploads/2023/02/Logotipo-*.png`, `icono-el-carnivoro.png` | Logotipo (blanco y negro) e icono | `npm run assets:icons` |
| `wp-uploads/2023/03/*.jpg` | Sesión de fotos del local y los platos (2023) | `npm run assets:images` |
| `wp-uploads/2023/06/IMG-*.jpg`, `2024/01/IMG-*.jpg` | Fotos del equipo (WhatsApp) | `npm run assets:images` (seleccionadas) |
| `wp-uploads/2023/03/pexels-denys-gromov-6577409.mp4` | Vídeo de Pexels (licencia libre) | Hero (`npm run assets:video`) |
| `wp-uploads/2024/01/VID-20231219-WA0056.mp4` | Vídeo real de las brasas | Clip de «Nuestra historia» |

Imágenes de la web anterior que **no** se usan (stock o plantilla, licencia sin acreditar):
`cabecera-inicio-*`, `fondo-carta*`, `horquilla-trozos-…`, `croquetas-elcarnivoro*`, `fondo-uvas-vinos*`,
`parrilladas*`, `surtido-deliciosos-desayunos`, `COCKTAILS`, `parrilla-variedad-carnes*`, `del-mar-fondo`,
`ensaladas-fondo`, `detalle-carne-dibujo`, `ajosylaurel*`, `fondo-galeria`, `contacto-salon-elcarnivoro`,
`interior-carnivoro-1` (baja resolución) y las fotos de WhatsApp con personas reconocibles
(no incluidas). Ver `CREDITS.md`.
