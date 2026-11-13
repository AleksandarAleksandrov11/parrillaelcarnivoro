# Restaurante Parrilla El Carnívoro — web

Web de **Restaurante Parrilla El Carnívoro** (Collado Villalba, Madrid) · https://www.parrillaelcarnivoro.es

Multipágina estática, rápida y accesible: Inicio, Carta, Galería (fotos y opiniones), Contacto,
textos legales y 404. **Las reservas se hacen solo por teléfono** (91 501 39 83): botón de llamar
siempre visible (barra fija abajo en móvil, botón flotante con el número en escritorio).
Desplegable en Vercel sin tocar nada.

> **Los textos legales deben ser revisados por el cliente o su asesor antes de publicar.**

## Stack

- **[Astro 7](https://astro.build)** con salida estática, TypeScript estricto y `astro:assets`
  (AVIF + WebP responsive, `srcset`/`sizes`, `width`/`height` explícitos, carga diferida).
- **CSS con variables** (sin framework): tokens de color, escala tipográfica fluida y estilos
  por componente. Las animaciones usan solo `transform` y `opacity`.
- **Animaciones con CSS + `IntersectionObserver` + View Transitions nativas** en lugar de GSAP:
  mismo resultado (revelados, parallax, texto palabra a palabra, transiciones entre páginas) con
  ~4 KB de JS en vez de ~45 KB, para cumplir el objetivo de «JS inicial casi 0».
  **Lenis** (scroll suave) se carga en diferido solo en escritorio.
- Sin React/Svelte: las partes interactivas (galería, banner de cookies, mapa, horario «abierto ahora»)
  son módulos TypeScript pequeños que Astro empaqueta por página.
- Fuentes autoalojadas (Cormorant Garamond + Manrope, WOFF2 latino, `font-display: swap`,
  métricas de respaldo ajustadas) con la API de fuentes de Astro; solo se precarga la principal.
- **Vercel**: `vercel.json` con redirecciones 301, `www`, cabeceras de seguridad y caché inmutable.

## Puesta en marcha

Requisitos: **Node.js 22.23.4 o superior** (lo exige Astro 7; en Vercel, Node 22.x o 24.x).

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run preview
```

`npm run preview` sirve `dist/` en http://localhost:4321 emulando Vercel (redirecciones y cabeceras
de `vercel.json`, Brotli, 404). `npm run check` comprueba los tipos.

### Estructura

```
src/
  data/           ← contenidos editables (carta, negocio, galería, opiniones)
    carta.ts      ← LA CARTA: platos, precios y menú de cenas (solo lo del PDF)
    site.ts       ← nombre, dirección, teléfono, horario, enlaces, datos legales
    gallery.ts    ← fotos de la galería, categoría y texto alternativo
    reviews.ts    ← opiniones reales de Google (selección) y nota media
  assets/photos/  ← fotos maestras (JPEG); Astro genera AVIF/WebP
  components/     ← cabecera, pie, hero, galería, botón de llamar, cookies…
  pages/          ← una carpeta por URL (/carta/, /contacto/…)
  scripts/        ← JS del cliente (consentimiento, GA4, galería, reserva…)
  styles/         ← sistema de diseño (global.css)
public/           ← vídeos, iconos, imágenes Open Graph
scripts/          ← preparación de recursos y QA
source-assets/    ← ORIGINALES (no forman parte del build)
```

## Desplegar en Vercel

1. En Vercel: **Add New → Project** e importa este repositorio de GitHub.
2. Vercel detecta Astro. Deja los valores por defecto (`npm run build`, salida `dist`); también
   están en `vercel.json`.
3. En **Settings → Environment Variables** añade `PUBLIC_GA_ID` (ver «Google Analytics»).
4. **Deploy**. Cada `git push` a `main` publica una nueva versión.

## Conectar el dominio parrillaelcarnivoro.es

1. En Vercel → proyecto → **Settings → Domains**, añade `www.parrillaelcarnivoro.es` y
   `parrillaelcarnivoro.es`. Marca **www como dominio principal** y configura el dominio sin `www`
   para que **redirija** a `www` (el `vercel.json` también lo hace con un 301).
2. En el panel DNS del registrador del dominio crea o modifica **solo** estos dos registros, con
   los valores **exactos que muestre Vercel** en *Settings → Domains* (cada proyecto tiene su
   propio CNAME, del tipo `xxxxxxxx.vercel-dns-017.com`):

   | Tipo | Nombre | Valor |
   |---|---|---|
   | A | `@` (raíz) | la IP que indique Vercel |
   | CNAME | `www` | el CNAME que indique Vercel para este proyecto |

3. **No toques los registros MX ni TXT** (son los del correo y sus verificaciones). Si existía un
   registro A o CNAME anterior para `@` o `www` que apuntaba al WordPress, sustitúyelo.
4. Espera a que Vercel muestre los dominios como válidos (el certificado HTTPS se emite solo).
5. Tras la publicación, en Google Search Console envía `https://www.parrillaelcarnivoro.es/sitemap.xml`.

## Google Analytics 4 (con Consent Mode v2)

- El ID de medición va en la variable de entorno **`PUBLIC_GA_ID`** (formato `G-XXXXXXXXXX`).
  Copia `.env.example` a `.env` para desarrollo local. En Vercel, añádela en Environment Variables
  y vuelve a desplegar.
- Con el valor de ejemplo `G-XXXXXXXXXX` o vacío, **GA4 no se carga nunca**.
- Por defecto `analytics_storage`, `ad_storage`, `ad_user_data` y `ad_personalization` están en
  `denied`. `gtag.js` solo se descarga cuando el usuario acepta la analítica en el banner; si la
  revoca, se deniega el consentimiento, se desactiva el envío y se borran las cookies `_ga`.
- Eventos: `phone_click` (con la zona de la web donde se pulsó), `directions_click`
  («Cómo llegar») y `view_menu` (vista de la carta). Ninguno incluye datos personales.

## Editar la carta

Todo está en **`src/data/carta.ts`** (un único archivo tipado; no hay que tocar componentes):

```ts
{ name: 'Entrecot', prices: [{ amount: 27 }] },                          // 27,00 €
{ name: 'Chuletón', prices: [{ amount: 48, per: 'kg' }] },               // 48,00 €/kg
{ name: 'Tomahawk', note: 'Con reserva previa', prices: [{ amount: 100, per: 'kg' }] },
{ name: 'Muriel Crianza', description: 'Tempranillo',
  prices: [{ amount: 3.4, label: 'Copa' }, { amount: 20, label: 'Botella' }] },
```

- Los precios se escriben como número con punto decimal (`14.9`) y la web los muestra en formato
  español (`14,90 €`). `per` admite `'kg'`, `'unidad'` y `'persona'`.
- Para quitar un plato, borra su línea; para añadirlo, copia una línea y cámbiala.
- El menú de cenas y fines de semana está en la misma lista (`kind: 'menu'`). Para añadir otro menú cerrado, copia ese bloque.
- La carta, sus datos estructurados (schema `Menu`) y los precios de la home se actualizan solos.
- Tras editar: `npm run build` (o simplemente `git push` y Vercel lo publica).

## Cambiar fotos

1. Copia la foto original a `source-assets/` (por orden) y añádela a la lista `PHOTOS` de
   `scripts/prepare-images.mjs` con un nombre descriptivo (p. ej. `solomillo-brasa-el-carnivoro`).
2. Ejecuta `npm run assets:images`: recorta, corrige, elimina metadatos y crea el JPEG maestro en
   `src/assets/photos/` y su placeholder desenfocado.
3. Úsala por su nombre: en la galería (`src/data/gallery.ts`, con su texto alternativo), en una
   sección de la carta (`photo` en `carta.ts`) o en un componente (`<Photo name="…" alt="…" />`).
4. Si cambias las fotos de portada, regenera las imágenes para redes con `npm run assets:og`.

Otros recursos: `npm run assets:video` (vídeos del hero y de las brasas; requiere ffmpeg con
libx264 y libsvtav1), `npm run assets:icons` (favicon, iconos y logotipo), `npm run assets:textures`.

## Opiniones

Las reseñas de la web están en **`src/data/reviews.ts`**: una selección de las más positivas de
Google, copiadas literalmente (nombre y la inicial del apellido). Para añadir una, copia un bloque y
pega el texto; con `home: true` sale en la portada (las tres primeras marcadas). La nota media y el
número de reseñas que se muestran (`googleRating`) son fijos: actualízalos de vez en cuando. El
botón «Ver todas las reseñas en Google» usa el enlace de `business.maps.reviews` en
`src/data/site.ts`.

## Datos del negocio

Nombre, dirección, teléfono, horario, Instagram, mapa y datos legales están en
**`src/data/site.ts`**. Se usan en toda la web y en el schema, así que basta con cambiarlos ahí.

- **Teléfono único**: 91 501 39 83 (`+34915013983`). Es el único canal de reservas: la web no
  tiene formularios ni WhatsApp.
- **Dirección**: «Local 4» en los datos comerciales y «Local 3-4» en los textos legales, tal y como
  figuraban en la web anterior. **Pendiente de confirmar con el cliente.**

## QA

`npm run qa` ejecuta la revisión automática (enlaces, teléfono, capturas responsive, validación
HTML/JSON-LD, cookies, accesibilidad, redirecciones, consola y Lighthouse). Los resultados están en **`QA.md`**.

## Pendiente de confirmar con el cliente

Ver la lista completa y actualizada en `QA.md` (sección «Datos pendientes»). En el código están
marcados con comentarios `TODO: confirmar con el cliente`.
