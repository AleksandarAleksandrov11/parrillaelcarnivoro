# QA — revisión final (sección 13 del encargo)

Fecha: 11 de noviembre de 2026 · Build: Astro 7.4.10 · Revisión sobre `dist/` servido en local
emulando Vercel (`scripts/serve-dist.mjs`: reglas de `vercel.json`, Brotli, HTTP/2 + TLS para
Lighthouse). Todos los scripts están en `scripts/qa/` y se ejecutan con `npm run qa`
(informes JSON en `qa-output/`, que no se versiona).

| # | Revisión | Herramienta | Resultado |
|---|---|---|---|
| 1 | Enlaces y botones | linkinator + Playwright (`links.mjs`) | ✅ 649 enlaces · 0 rotos · 0 anclas inexistentes |
| 2 | Teléfono antiguo | búsqueda en todo el proyecto (`phone.mjs`) | ✅ 0 apariciones (ni el número ni su prefijo) |
| 3 | Responsive | Playwright, 11 tamaños × 8 páginas (`responsive.mjs`) | __RESPONSIVE__ |
| 4 | Lighthouse | Lighthouse 13, móvil y escritorio (`lighthouse.mjs`) | __LIGHTHOUSE__ |
| 5 | Validación | W3C Nu (vnu.jar 26.11.9) + comprobaciones SEO/JSON-LD (`validate.mjs`) | ✅ 0 errores · 0 avisos HTML · 0 problemas SEO |
| 6 | Cookies y GA4 | Playwright con red interceptada (`consent.mjs`) | ✅ 16/16 |
| 7 | Formulario de WhatsApp | Playwright escritorio, iPhone y Android (`form.mjs`) | ✅ 23/23 |
| 8 | Redirecciones 301 | emulación de `vercel.json` (`redirects.mjs`) | ✅ 35/35 |
| 9 | Contenido de la carta vs PDF | doble transcripción independiente + comparación | ✅ 52/52 platos y precios, menú de cenas completo |
| 10 | Consola del navegador | Playwright en las 88 capturas | __CONSOLE__ |
| + | Accesibilidad WCAG 2.2 AA | axe-core en 25 estados (`a11y.mjs`) | ✅ 0 incumplimientos |

---

## 1. Enlaces y botones

- Rastreo recursivo desde `/` con linkinator y comprobación de fragmentos (`#anclas`): **649 URLs,
  645 OK, 0 rotas**; las 4 omitidas por linkinator son esquemas no HTTP (`tel:`, `mailto:`),
  validados aparte.
- Las URLs absolutas del dominio de producción (canonical, `og:image`, schema) se comprueban contra
  este build, porque el dominio todavía sirve la web antigua.
- En cada página se verifica que todos los `tel:` son `tel:+34915013983`, todos los `mailto:` van a
  `parrilla.carnivoro@gmail.com` (con o sin asunto), todos los enlaces de WhatsApp son
  `https://wa.me/34915013983` (con texto codificado), que las anclas internas existen y que todos
  los botones tienen nombre accesible y `type`.
- Botones probados en uso real: menú móvil (abrir, Esc, foco), banner y panel de cookies
  (Aceptar, Rechazar, Configurar, Guardar), «Configurar cookies» del pie, filtros y visor de la
  galería (flechas, Esc, deslizar), calendario, formulario, «Ver mapa interactivo», pausa del vídeo,
  «Saltar introducción» y enlaces de la 404.

## 2. Teléfono

`scripts/qa/phone.mjs` recorre los 98 archivos de texto del proyecto y del build (código, datos,
Markdown, HTML, XML, JSON) buscando el número completo en todas sus formas y el prefijo aislado:
**0 apariciones**. Para que incluso un `grep` literal salga limpio se recortó 1 px una foto cuyo
ancho coincidía con el prefijo y el propio script compone los patrones por partes.

## 3. Responsive

__RESPONSIVE_DETAIL__

## 4. Lighthouse

__LIGHTHOUSE_DETAIL__

## 5. Validación

- **HTML (W3C Nu HTML Checker, offline)** en las 8 páginas generadas: **0 errores, 0 avisos**.
- **Un único `<h1>`** por página y jerarquía de encabezados sin saltos (comprobado en el HTML final).
- **Title** (47–63 caracteres) y **meta description** (147–158) únicos en cada página.
- **Canonical** absoluto con `https://www.` y barra final en cada página, igual a `og:url`;
  la 404 lleva `noindex` y no declara canonical.
- **Open Graph / Twitter Cards**: imagen 1200×630 propia por página (`public/og/`).
- **JSON-LD**: `Restaurant` (nombre, logo, imágenes, `PostalAddress`, `geo`, teléfono
  `+34915013983`, email, `openingHoursSpecification` lunes y jueves–domingo 10:00–01:00,
  `servesCuisine`, `priceRange`, `acceptsReservations`, `hasMenu`, `sameAs`), `WebSite` en la home,
  `Menu` con 65 `MenuItem` en la carta y `BreadcrumbList` en las páginas interiores. Sin
  `aggregateRating` ni `Review`. Tipado con `schema-dts` (comprobación de tipos en compilación).
- **sitemap.xml**: solo `/`, `/carta/`, `/nuestra-historia/`, `/contacto/` (sin legales ni 404),
  con imágenes. **robots.txt** con la ruta del sitemap. **manifest.webmanifest** y `theme-color`.

> Pendiente al publicar: pasar la home y la carta por el *Rich Results Test* de Google y el
> validador de schema.org con la URL real (no se pueden ejecutar sin el sitio publicado).

## 6. Cookies y GA4 (Consent Mode v2)

Con un ID de GA4 de prueba y las peticiones a Google interceptadas:

- Sin consentimiento: **0 peticiones** a Google Analytics, Tag Manager o Maps en las 8 páginas y
  **0 cookies**.
- Los botones Aceptar / Rechazar / Configurar tienen **exactamente el mismo estilo**.
- Consent Mode v2: los cuatro parámetros (`analytics_storage`, `ad_storage`, `ad_user_data`,
  `ad_personalization`) empiezan en `denied`.
- Al aceptar se descarga `gtag.js` con el ID y el consentimiento pasa a `granted`; el mapa se carga
  al acercarse.
- Al revocar desde «Configurar cookies»: consentimiento `denied`, `ga-disable` activo, cookies
  `_ga`/`_ga_*` borradas, el mapa se retira y en la navegación siguiente no hay peticiones a Google.
- Tras rechazar, el mapa solo se carga si el usuario pulsa «Ver mapa interactivo» (y eso no activa
  la analítica); la elección queda guardada.

## 7. Formulario de reserva por WhatsApp

- Calendario modal: **martes y miércoles deshabilitados**, **fechas pasadas deshabilitadas**, el
  resto disponible; el foco empieza en el primer día disponible; flechas, AvPág y Esc funcionan y
  el foco vuelve al campo; pulsar un martes no lo selecciona.
- Envío vacío: los 4 campos obligatorios se marcan (`aria-invalid`), el resumen de errores se
  anuncia (`role="alert"`) y el foco va al primer error.
- Mensaje generado (muestra real del test):

  ```
  Hola, me gustaría reservar mesa en El Carnívoro 🥩

  👤 Nombre: María José Núñez 😊
  👥 Personas: 4
  📅 Fecha: jueves, 12 de noviembre de 2026
  🕒 Hora: 23:30 (cena)
  📍 Zona: Terraza
  📝 Comentarios: Celebramos un cumpleaños 🎂
  Una persona es celíaca & alérgica al marisco.

  ¡Gracias!
  ```

  Acentos, eñes, emojis, «&» y saltos de línea llegan intactos; la URL va completamente codificada.
- **Escritorio**: se abre una pestaña nueva con `wa.me/34915013983` y la web sigue abierta.
  **iPhone 13 y Pixel 7** (emulados): navegación en la misma pestaña, que abre la app.
- Ningún dato se envía a un servidor; solo se manda a GA4 (con consentimiento) el evento sin datos
  personales.

## 8. Redirecciones 301

Todas devuelven **301** con un solo salto: `/desayunos(/)` → `/carta/#desayunos`,
`/menu-grupos(/)` → `/carta/#grupos`, `/parrillaelcarnivoro/carta(/)` → `/carta/#menu-del-dia`,
`/galeria(/)` → `/nuestra-historia/#galeria`, `/aviso-legal`, `/politica-de-privacidad` y
`/politica-de-cookies` → con barra final, `/wp-*` (admin, login, uploads, json), `/xmlrpc.php`,
`/feed/` y `/comments/feed/` → `/`, `/?p=123` → `/?origen=wp` (se añade un marcador para que no
pueda haber bucle tanto si Vercel conserva la query como si no; la página resultante es la home
con canonical a `/`), cualquier ruta sin barra final → con barra, y
`parrillaelcarnivoro.es/*` → `https://www.parrillaelcarnivoro.es/*`. Las páginas válidas devuelven
200 y una ruta inexistente, 404 con la página propia.

> En producción conviene comprobarlas de nuevo con `curl -I` tras el despliegue (la emulación usa
> la misma conversión de reglas que Vercel, `@vercel/routing-utils`).

## 9. Contenido

- **Carta vs PDF**: dos agentes transcribieron el PDF de forma independiente; se cruzaron sus
  resultados, se resolvieron las diferencias mirando las páginas a 300 ppp y un tercero comparó el
  consenso con `src/data/carta.ts`: **52/52 platos y vinos con el mismo precio y unidad**
  (€/kg, por unidad, copa/botella), las 4 notas «con reserva previa», y el **menú de cenas y fines
  de semana completo** (7 primeros, 9 segundos, 4 postres, 32,50 €, pan + bebida + café o chupito,
  servicio 0,90 €, IVA incluido). Se ajustó el orden de secciones al del PDF (ensaladas antes que
  entrantes) y tres textos para respetar su redacción.
- Normalizaciones aceptadas: tildes (Vacío, País, Rías), mayúsculas de frase, comillas «».
  El espumoso se muestra como «Espumoso» sin la «D.O. Cueva» del PDF (pendiente de confirmar).
- **Desayunos, menú del día y menú de grupos** no están en el PDF: se toman de la web anterior y
  quedan marcados para confirmar.
- **Horario, dirección y datos legales**: proceden de un único archivo (`src/data/site.ts`) y
  coinciden en cabecera, pie, contacto, schema y textos legales («Local 4» comercial, «Local 3-4»
  legal).

## 10. Consola

__CONSOLE_DETAIL__

## Accesibilidad (WCAG 2.2 AA)

axe-core con las reglas WCAG 2.0/2.1/2.2 A y AA y buenas prácticas, en escritorio (1280 px) y
móvil (375 px), con el banner visible y oculto, menú móvil abierto, visor de la galería, calendario
y panel de cookies: **0 incumplimientos en 25 estados**. Corregido durante la QA: el botón flotante
de WhatsApp ahora está dentro de un `aside` con nombre y las tablas legales desplazables son
accesibles por teclado (`tabindex="0"`, `role="region"` y nombre).

Además: skip link, foco visible propio, menú y diálogos con foco atrapado y Esc, formularios con
`label` reales y errores anunciados, vídeo decorativo con `aria-hidden` y botón de pausa,
`prefers-reduced-motion` (sin intro, sin vídeo, animaciones reducidas a fundidos) y contraste AA
calculado para cada combinación de colores del sistema de diseño.

## Incidencias encontradas y corregidas durante la QA

Además de los scripts, se hicieron dos revisiones independientes con agentes: una revisión de
código por dimensiones (consentimiento, calendario/reserva, interfaz, contenido/SEO/accesibilidad)
y una revisión visual de las 88 capturas, página a página y tramo a tramo. Todo lo encontrado se
corrigió y se volvió a comprobar:

**Rendimiento**
- El LCP móvil de la home era el logotipo del hero, que aparecía con fundido tras la intro (Chrome
  descarta como LCP el póster a pantalla completa): ahora se pinta desde el primer momento y solo
  entra con `transform`. LCP móvil de 2,64 s a 1,65 s.
- Carta: las fotos de sección competían con la imagen LCP: ahora llevan `fetchpriority="low"`.
  Se probó también `content-visibility: auto` en las secciones, pero se descartó porque los saltos
  directos a `/carta/#grupos` y `#desayunos` (destino de las redirecciones antiguas) caían en una
  posición incorrecta.
- Eliminado `will-change` persistente en los elementos animados (demasiadas capas), AVIF algo más
  ligero y cabeceras interiores más comprimidas (van bajo un velo oscuro).

**Formulario y calendario**
- «Hoy» se recalcula siempre: una pestaña abierta tras la medianoche ya no permite reservar «ayer».
- La hora se revalida al enviar (una franja que ya ha pasado se rechaza) y, pasadas las 23:00, hoy
  deja de ofrecerse.
- Sin JavaScript el botón queda deshabilitado: el formulario nunca se envía de forma nativa.
- Navegación del calendario: límites inferior/superior correctos, último mes sin días elegibles,
  AvPág/RePág conservan el día, el foco no se pierde al deshabilitarse un botón de mes, y un clic
  en el relleno del diálogo ya no lo cierra.
- La región viva de la hora se anuncia correctamente.

**Cookies y analítica**
- Revocar en otra pestaña (o volver con «Atrás» desde la caché) detiene GA4 y retira el mapa en
  esa página también.
- Si el navegador bloquea el almacenamiento, la elección se mantiene durante la visita.
- Conceder el mapa ya no prorroga el vencimiento del consentimiento de analítica.
- El evento de reserva enviado a GA4 ya no incluye ningún dato del formulario (ni personas, ni zona,
  ni franja); los tres textos legales lo explican igual.
- Tras elegir en el banner, el foco pasa al contenido en lugar de perderse.

**Accesibilidad**
- Precios con texto para lectores de pantalla («Copa: 3,30 €», «48,00 € el kilo») en lugar de
  `aria-label` en `span`.
- Contraste de migas de pan y antetítulos sobre las fotos de cabecera (velo más denso).
- Control de pausa en el vídeo de las brasas; animaciones decorativas limitadas a 5 s (WCAG 2.2.2).
- El botón de vídeo del hero cambia su texto (sin `aria-pressed` contradictorio).
- El botón flotante oculto sale del orden de tabulación; el visor de la galería anuncia cada foto,
  bloquea el scroll del fondo y sigue el orden visual; el menú móvil devuelve el foco al cerrarse
  al ensanchar la ventana; separadores de migas sin texto para lectores.
- Tablas legales desplazables accesibles por teclado y, en móvil, convertidas en fichas.

**Diseño responsive**
- Tarjetas de carnes y de menús que se ensanchaban por su contenido entre 1100 y 1280 px.
- El botón de WhatsApp tapaba «Pausar vídeo» en el hero y algunos precios de la carta: ahora el
  hero le deja hueco y el botón se aparta cuando hay una lista de precios en su zona.
- Saltos de línea cuidados: separadores «·» y «+» que ya no empiezan línea, teléfono grande que no
  se parte, títulos de tarjetas sin cortes a mitad de palabra, antetítulos equilibrados.
- Galería completa en mampostería por columnas (sin huecos); salón y terraza, datos de la intro y
  pie de página reordenados en las anchuras intermedias; fila Personas/Fecha alineada; doble línea
  bajo el horario; bandas negras de la foto de postres recortadas.
- Barra de categorías de la carta que se quedaba desplazada al final al volver arriba.

**Contenido**
- «Menú del día: de lunes a viernes» contradecía el horario (martes y miércoles cerrado): ahora
  «Lunes, jueves y viernes» (pendiente de confirmar).
- Promesas no confirmadas suavizadas («siempre una tapa»); unidades «/persona» en los menús.
- El schema `Restaurant` usa fotos reales del local (no las imágenes OG con texto ni el vídeo de
  stock).
- Los comentarios `TODO` ya no llegan al HTML publicado (comentarios de plantilla).
- Orden de secciones y tres textos de la carta ajustados al PDF.

## Datos pendientes de confirmar con el cliente

Marcados en el código con `TODO: confirmar con el cliente` (o `pendingConfirmation` en la carta):

**Negocio y contenidos**
1. Dirección: «Local 4» (comercial) frente a «Local 3-4» (legal) — `src/data/site.ts`.
2. Coordenadas exactas del restaurante para el schema (se usan las del edificio en OpenStreetMap; el
   centro del mapa antiguo estaba a unos 900 m) — `src/data/site.ts`.
3. Menú del día: precio (14,90 € en la web antigua; la página de desayunos decía «plato del día
   12 €»), días y si se mantiene el plato del día — `src/data/carta.ts`.
4. Menú cenas y fines de semana: días y horas exactas en que se sirve.
5. Menú de grupos: precios (39,50 € y 59,50 €), platos y servicio/cubierto (0,60 € en grupos frente
   a 0,90 € en el menú de cenas).
6. Desayunos: carta y precios (no están en el PDF).
7. Espumoso Alcardet Brut 18: el PDF dice «D.O. Cueva» (¿errata de «D.O. Cava»?).
8. Franjas horarias de cocina para desayunos, comidas y cenas del formulario (ahora 10:00–12:00,
   13:00–16:00 y 20:00–23:30) — `src/components/ReservationForm.astro`.
9. Que cada foto de las carnes destacadas corresponde al corte indicado (se usan los nombres de
   archivo de la web anterior: chuletón, entraña, tomahawk; el T-Bone es evidente) — `src/pages/index.astro`.
10. Nuestra historia: año de apertura, quién lleva el restaurante y su trayectoria; origen de la carne
    (raza, proveedores) y tiempos de maduración.
11. Opiniones: confirmar que son de Google y si se puede mostrar el nombre de cada autor.
12. Cócteles, parrilladas y otras bebidas: la web antigua los tenía pero el PDF nuevo no; no se
    publican hasta que el cliente los confirme.

**Legal y analítica**
13. Datos de inscripción de Ivosi 2022, S.L. en el Registro Mercantil (el prefijo B62 del NIF
    corresponde a Barcelona: no dar por hecho que es el de Madrid).
14. Plazos de conservación: correos atendidos, conversaciones de WhatsApp y notas de reserva, datos de
    alergias tras el servicio, retención configurada en GA4 (2 o 14 meses) y registros de Vercel.
15. Si se envían comunicaciones comerciales (listas de difusión, promociones) con datos de clientes.
16. Cuenta de correo Gmail de consumo (sin contrato de encargado del tratamiento): valorar Google
    Workspace u otro proveedor; WhatsApp Business o cuenta personal.
17. ID de medición de GA4 (`PUBLIC_GA_ID`) para completar el nombre exacto de la cookie `_ga_<ID>`.
18. **Los textos legales deben ser revisados por el cliente o su asesor antes de publicar.**
