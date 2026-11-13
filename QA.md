# QA — estado final antes de publicar

Fecha: 13 de noviembre de 2026 (3.ª revisión) · Build: Astro 7.4.10 · Revisión sobre `dist/`
servido en local emulando Vercel (`scripts/serve-dist.mjs`: reglas de `vercel.json`, Brotli y
HTTP/2 + TLS para Lighthouse). Todo se repite con `npm run qa` (scripts en `scripts/qa/`,
informes JSON en `qa-output/`, que no se versiona).

| # | Revisión | Herramienta | Resultado |
|---|---|---|---|
| 1 | Enlaces | linkinator + Playwright (`links.mjs`, `anchors.mjs`) | ✅ 664 enlaces · 0 rotos · 0 anclas inexistentes · 16/16 saltos a ancla en su sitio · 0 enlaces de WhatsApp |
| 2 | Botones y enlaces en uso real | Playwright en iPhone 13, Pixel 7, iPad Mini, escritorio 1440 y 1920 (`interactions.mjs`) | ✅ 81/81 · ningún control tapado ni roto en ningún dispositivo |
| 3 | Teléfono antiguo | búsqueda en todo el proyecto (`phone.mjs`) | ✅ 0 apariciones (ni el número ni su prefijo) |
| 4 | Responsive | 11 tamaños × 8 páginas (`responsive.mjs`) | ✅ 88 capturas · 0 incidencias |
| 5 | Lighthouse | Lighthouse 13, móvil y escritorio, mediana de 3 (`lighthouse.mjs`) | ✅ escritorio 99–100 en rendimiento y 100 en accesibilidad, buenas prácticas y SEO en todas · móvil: accesibilidad, buenas prácticas y SEO 100 en todas, CLS ≤ 0,02 · ⚠️ rendimiento móvil 86–100 según la pasada (ver §5) |
| 6 | Validación | W3C Nu (vnu.jar) + SEO/JSON-LD (`validate.mjs`) | ✅ 0 errores · 0 avisos HTML · 0 problemas SEO |
| 7 | Cookies y GA4 | Playwright con red interceptada (`consent.mjs`) | ✅ 17/17 |
| 8 | Redirecciones 301 | emulación de `vercel.json` (`redirects.mjs`) | ✅ 36/36 |
| 9 | Carta vs PDF | doble transcripción independiente + comparación | ✅ 52/52 platos y vinos, menú de cenas completo |
| 10 | Consola del navegador | Playwright en las 88 capturas | ✅ 0 errores · 0 avisos |
| + | Accesibilidad WCAG 2.2 AA | axe-core en 23 estados (`a11y.mjs`) | ✅ 0 incumplimientos |

---

## Contenido publicado

- **Páginas**: Inicio, Carta, Galería (fotos y opiniones), Contacto, Aviso legal, Política de
  privacidad, Política de cookies y 404.
- **Carta**: solo lo que figura en el PDF nuevo: ensaladas, entrantes, carnes, pescados, postres,
  vinos y el **menú de cenas y fines de semana** (32,50 € por persona). Desayunos, menú del día y
  menú de grupos se han retirado porque no están en el PDF; sus URLs antiguas redirigen a la carta.
- **Reservas solo por teléfono** (91 501 39 83): no hay formulario ni WhatsApp. Botón de llamar
  siempre a mano: barra fija abajo en móvil y tablet, botón flotante con el número en escritorio
  (se aparta solo sobre las listas de precios de la carta y al llegar al pie).
- **Cabecera**: logotipo, menú centrado (Inicio, Carta, Galería, Contacto) y botón «Reservar», que
  llama.
- **Opiniones**: 17 reseñas reales de Google (las claramente positivas), nota 4,4 con más de 350
  reseñas y enlace «Ver todas las reseñas en Google».
- **Pie**: horario, dirección, teléfono, email, Instagram, enlaces legales, «Configurar cookies» y
  «Web hecha por AAS Marketing» (https://aasmarketing.com/).

## 1. Enlaces

- Rastreo recursivo desde `/` con linkinator y comprobación de fragmentos: **664 URLs, 660 OK,
  0 rotas** (las 4 restantes son `tel:` y `mailto:`, que se validan aparte).
- En cada página: todos los `tel:` son `tel:+34915013983`, todos los `mailto:` van a
  `parrilla.carnivoro@gmail.com`, hay al menos un enlace para llamar, no queda ningún enlace de
  WhatsApp, las anclas internas existen y todos los botones tienen nombre accesible y `type`.
- Saltos directos a ancla en escritorio y móvil (`/carta/#ensaladas`, `#carnes`, `#postres`,
  `#menu-cenas`, `#vinos`, `/galeria/#opiniones`, `/contacto/#reserva`, `/#visitanos`): la sección
  queda justo bajo la cabecera (**16/16**).

## 2. Botones y enlaces en uso real

`scripts/qa/interactions.mjs` abre las 8 páginas en **iPhone 13, Pixel 7, iPad Mini y escritorio
a 1440 y 1920 px**. En cada una lleva a la vista **cada enlace y cada botón visible** y comprueba
que no lo tapa nada (cabecera fija, botón de llamar, banner…), que los enlaces internos responden
200 y que el botón fijo de llamar está visible y marca el número correcto. Después usa los
controles principales: menú móvil, navegación, barra de secciones de la carta, filtros y visor de
la galería (abrir, flechas, Esc), «Ver mapa interactivo», «Configurar cookies», «Saltar
introducción» y el banner de cookies en la primera visita. **81/81 correctas.**

La prueba encontró un fallo real que se corrigió: en escritorio, al llegar al final de la página,
el botón flotante de llamar tapaba el enlace «AAS Marketing» del pie; ahora se aparta.

## 3. Teléfono

`phone.mjs` recorre los 99 archivos de texto del proyecto y del build buscando el móvil antiguo en
todas sus formas y su prefijo aislado: **0 apariciones**.

## 4. Responsive y consola

Capturas de página completa de las 8 páginas en 320, 375, 414, 768, 1024, 1280, 1440 y 1920 px y
en horizontal (iPhone SE, iPhone 14, tablet 1180×820): **88 capturas, 0 incidencias** (sin scroll
horizontal, sin elementos que se salgan, sin texto cortado) y **0 errores o avisos de consola**.
Se revisaron además a ojo la home y la carta en móvil y en escritorio tras los últimos cambios
(cabecera centrada, foto del tomahawk encuadrada en la carne, bloque del menú de cenas).

## 5. Lighthouse

Lighthouse 13.6 (Chrome for Testing 153), perfiles **móvil** (Moto G Power, 4G lenta, CPU ×4
simulada) y **escritorio**, con el build servido por HTTPS + HTTP/2 + Brotli como en Vercel. Cada
valor es la **mediana de 3 ejecuciones**; se hicieron **dos pasadas completas** tras los últimos
cambios:

| Página | Móvil: rendimiento (pasada 1 / 2) | Móvil: LCP | Escritorio | A11y · BP · SEO |
|---|---|---|---|---|
| `/` | 90 / 99 | 1,65 s | 99 / 100 | 100 · 100 · 100 |
| `/carta/` | 89 / 88 | 1,65 s | 100 / 100 | 100 · 100 · 100 |
| `/galeria/` | 90 / 92 | 1,35–1,65 s | 100 / 100 | 100 · 100 · 100 |
| `/contacto/` | 90 / 86 | 1,65–1,95 s | 100 / 100 | 100 · 100 · 100 |
| `/aviso-legal/` | 90 / 91 | 1,00 s | 100 / 100 | 100 · 100 · 100 |
| `/politica-de-privacidad/` | 94 / 93 | 0,98 s | 100 / 99 | 100 · 100 · 100 |
| `/politica-de-cookies/` | 100 / 100 | 1,00 s | 100 / 100 | 100 · 100 · 100 |

**Lectura de los resultados.**

- **Cumplen siempre**: accesibilidad, buenas prácticas y SEO 100; CLS ≤ 0,02; JavaScript propio
  5–6 KB por página; LCP < 1,8 s en todas las páginas salvo contacto, que en las pasadas completas
  da 1,95 s (medido aparte, 1,35–1,65 s).
- **No es estable** el rendimiento móvil, por el TBT (tiempo de bloqueo). Esta medición se ha hecho
  en una máquina virtual distinta y más lenta que la de la revisión anterior: su índice de CPU baja
  de 2.500–3.000 a 2.000–2.400.
  - El mismo build que el 11 de noviembre daba 100 en la home, en esta máquina da 91–99.
  - El aviso legal, que no ha cambiado (5 KB de JS), oscila entre 90 y 100.
  - Medida de una en una, la home da entre 88 y 100 tanto con el vídeo del hero como sin él: el vídeo
    no es la causa.
- **Conclusión**: el rendimiento real hay que confirmarlo con **PageSpeed Insights** sobre el
  dominio publicado, que mide en máquinas de referencia.

## 6. Validación y SEO

- **W3C Nu HTML Checker** en las 8 páginas: **0 errores, 0 avisos**.
- Un único `<h1>` por página; title y meta description únicos; canonical absoluto con
  `https://www.` y barra final; la 404 lleva `noindex`.
- **JSON-LD**: `Restaurant` (dirección, `geo`, teléfono, horario, `servesCuisine`, `hasMenu`…),
  `WebSite`, `Menu` con 53 `MenuItem` (52 de la carta + el menú de cenas) y `BreadcrumbList` en las
  páginas interiores. Sin `aggregateRating` ni `Review` (Google no las admite si las publica el
  propio negocio).
- Todas las imágenes tienen `alt` descriptivo y los textos ancla son cortos y no se duplican sin
  necesidad.
- `sitemap.xml` (4 URLs con imágenes), `robots.txt` y `manifest.webmanifest`; imagen Open Graph
  1200×630 propia por página.

## 7. Cookies y GA4 (Consent Mode v2)

Con un ID de GA4 de prueba y las peticiones a Google interceptadas (17 comprobaciones): sin
consentimiento, **0 peticiones** a Google y **0 cookies**; Aceptar / Rechazar / Configurar con el
mismo estilo; los cuatro parámetros de Consent Mode empiezan en `denied`; al aceptar se carga
`gtag.js`; al revocar se borran las cookies `_ga` y se deja de enviar; el mapa solo se carga con
consentimiento o al pulsar «Ver mapa interactivo»; la elección se respeta entre pestañas.

## 8. Redirecciones 301

Todas con un solo salto: `/desayunos(/)` y `/parrillaelcarnivoro/carta(/)` → `/carta/`,
`/menu-grupos(/)` → `/carta/#menu-cenas`, `/nuestra-historia(/)` y `/galeria` → `/galeria/`,
textos legales sin barra → con barra, `/wp-*`, `/xmlrpc.php` y los feeds → `/`, `/?p=…` →
`/?origen=wp`, cualquier ruta sin barra final → con barra, y `parrillaelcarnivoro.es/*` →
`https://www.parrillaelcarnivoro.es/*`. Hay que volver a comprobarlas en producción con `curl -I`.

## 9. Carta frente al PDF

Dos transcripciones independientes del PDF cruzadas entre sí y con `src/data/carta.ts`: **52/52
platos y vinos con el mismo precio y unidad**, las 4 notas «con reserva previa» y el menú de cenas
completo (7 primeros, 9 segundos, 4 postres, 32,50 €, pan + bebida + café o chupito, servicio
0,90 €, IVA incluido).

## Accesibilidad (WCAG 2.2 AA)

axe-core (WCAG 2.0/2.1/2.2 A y AA) en escritorio y móvil, con el banner visible y oculto, menú
móvil abierto, visor de la galería y panel de cookies: **0 incumplimientos en 23 estados**. Además:
skip link, foco visible, diálogos con foco atrapado y Esc, `prefers-reduced-motion` (sin intro ni
vídeo) y contraste AA. **Excepción aceptada por el cliente**: el vídeo del hero no tiene botón de
pausa (WCAG 2.2.2 lo pide para movimiento automático de más de 5 s); con «reducir movimiento»
activado en el dispositivo se muestra la foto fija.

---

## Antes de publicar: qué falta

**Imprescindible**
1. **Datos registrales de Ivosi 2022, S.L.** (Registro Mercantil: provincia, tomo, folio, hoja e
   inscripción). La LSSI-CE obliga a mostrarlos en el aviso legal; ahora pone solo «Sociedad
   inscrita en el Registro Mercantil». El prefijo B62 del NIF corresponde a Barcelona: no dar por
   hecho que es Madrid — `src/pages/aviso-legal/index.astro`.
2. **Revisión de los textos legales** por el cliente o su asesor.
3. **Dirección**: «Local 4» (web) frente a «Local 3-4» (textos legales) — `src/data/site.ts`.

**Recomendable**
4. **ID de Google Analytics 4** (`PUBLIC_GA_ID` en Vercel). Sin él la web funciona igual y no
   carga Google Analytics; el banner sigue preguntando por la analítica (y por el mapa).
5. Plazos de conservación de datos (correos, notas de reserva, alergias, GA4) y si se envían
   comunicaciones comerciales — política de privacidad.
6. Cuenta de Gmail de consumo: valorar Google Workspace u otro proveedor con contrato de encargo.

**Contenido por confirmar (no impide publicar)**
7. Días y horas exactas del menú de cenas y fines de semana (ahora: «Cenas y fines de semana»).
8. Espumoso Alcardet Brut 18: el PDF dice «D.O. Cueva» (¿«D.O. Cava»?); se muestra sin D.O.
9. Que las 17 reseñas son de 5 estrellas (en el texto recibido no se veían las estrellas) y que se
   puede mostrar el nombre con la inicial del apellido — `src/data/reviews.ts`.
10. Nota media y número de reseñas (4,4 y «más de 350»): valores fijos que hay que actualizar a
    mano — `src/data/reviews.ts`.
11. Que cada foto de carne corresponde al corte indicado (chuletón, entraña, tomahawk).
12. Coordenadas exactas del restaurante para el schema (se usan las del edificio en OpenStreetMap).

## Después de publicar

- Comprobar las redirecciones con `curl -I` (apex → www, URLs antiguas de WordPress).
- Pasar la home y la carta por **PageSpeed Insights** y por la **Prueba de resultados enriquecidos**
  de Google.
- En **Google Search Console**: verificar el dominio y enviar `https://www.parrillaelcarnivoro.es/sitemap.xml`.
- En el **Perfil de Empresa de Google**: confirmar que la web es `https://www.parrillaelcarnivoro.es/`.
