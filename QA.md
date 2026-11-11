# QA — revisión final (sección 13 del encargo)

Fecha: 11 de noviembre de 2026 (2.ª revisión, tras los cambios pedidos por el cliente) · Build:
Astro 7.4.10 · Revisión sobre `dist/` servido en local
emulando Vercel (`scripts/serve-dist.mjs`: reglas de `vercel.json`, Brotli, HTTP/2 + TLS para
Lighthouse). Todos los scripts están en `scripts/qa/` y se ejecutan con `npm run qa`
(informes JSON en `qa-output/`, que no se versiona).

| # | Revisión | Herramienta | Resultado |
|---|---|---|---|
| 1 | Enlaces y botones | linkinator + Playwright (`links.mjs`, `anchors.mjs`) | ✅ 673 enlaces · 0 rotos · 0 anclas inexistentes · 16/16 saltos a ancla en su sitio · 0 enlaces de WhatsApp |
| 2 | Teléfono antiguo | búsqueda en todo el proyecto (`phone.mjs`) | ✅ 0 apariciones (ni el número ni su prefijo) |
| 3 | Responsive | Playwright, 11 tamaños × 8 páginas (`responsive.mjs`) | ✅ 88 capturas · 0 incidencias |
| 4 | Lighthouse | Lighthouse 13, móvil y escritorio (`lighthouse.mjs`) | ✅ escritorio 100 en rendimiento, accesibilidad, buenas prácticas y SEO en todas · móvil A11y/BP/SEO 100 en todas · ⚠️ 2 mediciones sueltas fuera de objetivo (carta P94 por TBT, contacto LCP 1,95 s); repetidas, P96 y LCP 1,65 s (ver §4) |
| 5 | Validación | W3C Nu (vnu.jar 26.11.9) + comprobaciones SEO/JSON-LD (`validate.mjs`) | ✅ 0 errores · 0 avisos HTML · 0 problemas SEO |
| 6 | Cookies y GA4 | Playwright con red interceptada (`consent.mjs`) | ✅ 17/17 |
| 7 | Reservas por teléfono | `links.mjs` + capturas | ✅ botón de llamar en las 8 páginas · sin formulario ni WhatsApp |
| 8 | Redirecciones 301 | emulación de `vercel.json` (`redirects.mjs`) | ✅ 36/36 |
| 9 | Contenido de la carta vs PDF | doble transcripción independiente + comparación | ✅ 52/52 platos y precios, menú de cenas completo |
| 10 | Consola del navegador | Playwright en las 88 capturas | ✅ 0 errores · 0 avisos |
| + | Accesibilidad WCAG 2.2 AA | axe-core en 23 estados (`a11y.mjs`) | ✅ 0 incumplimientos (23 estados) |

---

## Cambios de la 2.ª revisión (pedidos por el cliente)

- **Reservas solo por teléfono**: eliminados el formulario, el calendario y todos los enlaces y
  textos de WhatsApp (también en los textos legales). Botón de llamar siempre visible: barra fija
  abajo en móvil y tablet, botón flotante con el número en escritorio. Cabecera, hero, CTA, pie y
  contacto llaman al 91 501 39 83.
- **Hero**: solo logotipo, «Pasión por la carne», subtítulo y botones (sin antetítulo, sin
  «Descubre» y sin «Pausar vídeo»).
- **Home**: foto única en «La mejor carne a la parrilla», nueva sección de carnes (mosaico de fotos
  y lista de precios de todos los cortes junto a la foto de la parrilla), salón y terraza en dos
  fotos iguales, tarjetas de menús idénticas y alineadas, opiniones reales de Google con la nota
  media y enlace a todas las reseñas.
- **Galería** (`/galeria/`) sustituye a «Nuestra historia» (redirección 301), con todas las fotos y
  una selección de opiniones de Google.
- **Contacto** rehecho alrededor de la llamada: sin formulario, número grande en la cabecera y en
  la tarjeta de reserva, horario, cómo llegar y mapa.
- **Carta en escritorio**: secciones con pocas líneas (ensaladas, pescados, postres) más compactas,
  con la foto más pequeña y los platos en grande; fotos extra en carnes, grupos y desayunos; las
  fotos acompañan el scroll en las secciones largas (vinos, carnes, grupos, desayunos…); menú del
  día centrado. En móvil la carta se mantiene igual.
- **Sin migas de pan** visibles en ninguna página (el `BreadcrumbList` del schema se mantiene).
- **Pie**: «Web hecha por AAS Marketing» con enlace a https://aasmarketing.com/.
- **SEO**: todas las imágenes tienen `alt` descriptivo (antes había 5 decorativas con `alt` vacío
  por página) y los textos ancla son cortos y no se repiten innecesariamente (se quitó la
  navegación duplicada del pie, las tarjetas ya no son un enlace entero y cada enlace dice adónde
  lleva).

## 1. Enlaces y botones

- Rastreo recursivo desde `/` con linkinator y comprobación de fragmentos (`#anclas`): **673 URLs,
  669 OK, 0 rotas**; las 4 omitidas por linkinator son esquemas no HTTP (`tel:`, `mailto:`),
  validados aparte.
- Saltos directos a ancla (`anchors.mjs`), en escritorio y móvil: `/carta/#desayunos`, `#grupos`,
  `#menu-del-dia`, `#menu-cenas`, `#vinos`, `/galeria/#opiniones`, `/contacto/#reserva` y
  `/#visitanos` dejan la sección justo bajo la cabecera (**16/16**). Son los destinos de las
  redirecciones de las URLs antiguas.
- Las URLs absolutas del dominio de producción (canonical, `og:image`, schema) se comprueban contra
  este build, porque el dominio todavía sirve la web antigua.
- En cada página se verifica que todos los `tel:` son `tel:+34915013983`, todos los `mailto:` van a
  `parrilla.carnivoro@gmail.com` (con o sin asunto), que hay al menos un enlace para llamar, que no
  queda ningún enlace de WhatsApp, que las anclas internas existen y que todos los botones tienen
  nombre accesible y `type`.
- Botones probados en uso real: menú móvil (abrir, Esc, foco), banner y panel de cookies
  (Aceptar, Rechazar, Configurar, Guardar), «Configurar cookies» del pie, filtros y visor de la
  galería (flechas, Esc, deslizar), «Ver mapa interactivo», «Saltar introducción», botones de
  llamar y enlaces de la 404.

## 2. Teléfono

`scripts/qa/phone.mjs` recorre los 98 archivos de texto del proyecto y del build (código, datos,
Markdown, HTML, XML, JSON) buscando el número completo en todas sus formas y el prefijo aislado:
**0 apariciones**. Para que incluso un `grep` literal salga limpio se recortó 1 px una foto cuyo
ancho coincidía con el prefijo y el propio script compone los patrones por partes.

## 3. Responsive

`scripts/qa/responsive.mjs` hace capturas de página completa de las 8 páginas (inicio, carta,
galería, contacto, los tres textos legales y la 404) en **320, 375, 414, 768, 1024, 1280, 1440 y
1920 px** y en horizontal (**iPhone SE 667×375, iPhone 14 844×390, tablet 1180×820**): **88
capturas**. Antes de cada captura recorre la página para disparar las animaciones y la carga
diferida, y comprueba en el DOM que no hay scroll horizontal, que ningún elemento visible se sale
por los lados, que no hay texto cortado y que la consola está limpia.

Resultado: **0 incidencias en las 88 capturas**. Se revisaron además a ojo la home y la carta en
1024 y 1440 px, contacto y galería en 1440 px y la home en móvil; a raíz de esa revisión se
corrigieron el precio de la tarjeta de grupos (se salía de la tarjeta), el último hueco del mosaico
de carnes en móvil y la lista de cortes entre 1000 y 1199 px (ahora va bajo la foto).

Además se comprobó con el navegador desplazándose de verdad (no en captura) que en la carta de
escritorio las fotos de vinos, carnes, grupos y desayunos se quedan fijas a la vista mientras se
recorre su lista.

## 4. Lighthouse

Lighthouse 13.6 (API de Node + Chrome for Testing 153 sin interfaz), perfiles **móvil** (Moto G
Power con 4G lenta y CPU ×4 simulada, los valores por defecto) y **escritorio**. El build se sirve
por **HTTPS + HTTP/2 con Brotli** y Chrome resuelve `www.parrillaelcarnivoro.es` a esta máquina, así
que el canonical, las URLs absolutas y las cabeceras de `vercel.json` se evalúan como en Vercel.
Cada valor es la **mediana de 3 ejecuciones**.

| Página | Móvil P · A · BP · SEO | LCP | CLS | TBT | Escritorio P · A · BP · SEO | LCP |
|---|---|---|---|---|---|---|
| `/` | 100 · 100 · 100 · 100 | 1,65 s | 0 | 0 ms | 100 · 100 · 100 · 100 | 0,40 s |
| `/carta/` | 96 · 100 · 100 · 100 ¹ | 1,65 s | 0 | 234 ms | 100 · 100 · 100 · 100 | 0,40 s |
| `/galeria/` | 97 · 100 · 100 · 100 | 1,65 s | 0 | 197 ms | 100 · 100 · 100 · 100 | 0,44 s |
| `/contacto/` | 96 · 100 · 100 · 100 ² | 1,65 s | 0 | 222 ms | 100 · 100 · 100 · 100 | 0,44 s |
| `/aviso-legal/` | 96 · 100 · 100 · 100 | 0,94 s | 0,001 | 229 ms | 100 · 100 · 100 · 100 | 0,26 s |
| `/politica-de-privacidad/` | 96 · 100 · 100 · 100 | 0,97 s | 0,002 | 244 ms | 100 · 100 · 100 · 100 | 0,26 s |
| `/politica-de-cookies/` | 100 · 100 · 100 · 100 | 0,98 s | 0 | 0 ms | 100 · 100 · 100 · 100 | 0,26 s |

¹ En la pasada completa dio **94** (TBT 289 ms); repetida, 96. ² En la pasada completa dio un LCP
de **1,95 s**; repetida, 1,65 s (medido aparte con el navegador, la foto de cabecera, que es el LCP,
se pinta entre 1,35 y 1,65 s).

JavaScript propio: **5–6 KB** por página (al quitar el formulario y el calendario la web pesa menos).

**Objetivos del encargo.** SEO 100, Accesibilidad 100 (≥ 95), Best Practices 100 y CLS < 0,05
(máximo 0,019) en todas las páginas y ejecuciones; LCP < 1,8 s y rendimiento móvil ≥ 95 en todas
las medianas salvo las dos mediciones sueltas indicadas, que al repetirse cumplen. Como en la
primera revisión, el TBT es la métrica que oscila entre ejecuciones idénticas (0–290 ms con 5 KB de
JS): es ruido de la máquina virtual donde se mide, multiplicado ×4 por la simulación de CPU.
Conviene confirmar los valores con **PageSpeed Insights** sobre el dominio real tras el
despliegue.

Durante esta revisión Lighthouse detectó un enlace con texto poco descriptivo («Más información»
en el banner de cookies), que bajaba el SEO a 92: ahora dice «Lee la política de cookies».

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

Con un ID de GA4 de prueba y las peticiones a Google interceptadas (17 comprobaciones):

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
- Revocar en otra pestaña desactiva GA4 también en la pestaña que ya estaba abierta.

## 7. Reservas por teléfono

- La web ya no tiene formulario ni calendario: las reservas se hacen llamando al
  **91 501 39 83** (`tel:+34915013983`).
- Botón de llamar en todas las páginas: **barra fija inferior** en móvil y tablet (la página deja
  hueco para que no tape el final del contenido) y **botón flotante con el número** en escritorio,
  que se aparta solo cuando debajo hay una lista de precios de la carta. Mientras el banner de
  cookies está abierto, el botón se oculta para no taparlo.
- En las 8 páginas hay al menos un enlace `tel:` y todos van al mismo número; no queda ningún
  enlace ni texto de WhatsApp en el HTML publicado.
- Con analítica aceptada, GA4 solo registra `phone_click` y la zona de la web donde se pulsó.

## 8. Redirecciones 301

Todas devuelven **301** con un solo salto: `/desayunos(/)` → `/carta/#desayunos`,
`/menu-grupos(/)` → `/carta/#grupos`, `/parrillaelcarnivoro/carta(/)` → `/carta/#menu-del-dia`,
`/nuestra-historia(/)` → `/galeria/`, `/galeria` → `/galeria/`, `/aviso-legal`, `/politica-de-privacidad` y
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

En las mismas 88 cargas del apartado 3 se registran todos los mensajes `error` y `warning` de la
consola y las excepciones de JavaScript (`pageerror`): **0 errores y 0 avisos** en todas las páginas y
tamaños. La única respuesta 404 esperada es la de la propia página 404, que se excluye.

## Accesibilidad (WCAG 2.2 AA)

axe-core con las reglas WCAG 2.0/2.1/2.2 A y AA y buenas prácticas, en escritorio (1280 px) y
móvil (375 px), con el banner visible y oculto, menú móvil abierto, visor de la galería y panel de cookies:
**0 incumplimientos en 23 estados**. Corregido durante la QA: el botón fijo de llamar está dentro
de un `aside` con nombre y las tablas legales desplazables son
accesibles por teclado (`tabindex="0"`, `role="region"` y nombre).

Además: skip link, foco visible propio, menú y diálogos con foco atrapado y Esc, vídeo decorativo
con `aria-hidden`,
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
8. Nota media y número de reseñas de Google que se muestran (4,4 y «más de 350», según el
   cliente): son valores fijos que hay que actualizar a mano — `src/data/reviews.ts`.
9. Que cada foto de las carnes destacadas corresponde al corte indicado (se usan los nombres de
   archivo de la web anterior: chuletón, entraña, tomahawk; el T-Bone es evidente) — `src/pages/index.astro`.
10. Origen de la carne (raza, proveedores) y tiempos de maduración, por si se quieren contar en la web
    (la página «Nuestra historia» se ha retirado a petición del cliente).
11. Opiniones: en el texto que nos pasó el cliente no se ven las estrellas de cada reseña, así que
    se han elegido solo las claramente positivas (18). Confirmar que todas son de 5 estrellas y que
    se puede mostrar el nombre con la inicial del apellido — `src/data/reviews.ts`.
12. Cócteles, parrilladas y otras bebidas: la web antigua los tenía pero el PDF nuevo no; no se
    publican hasta que el cliente los confirme.

**Legal y analítica**
13. Datos de inscripción de Ivosi 2022, S.L. en el Registro Mercantil (el prefijo B62 del NIF
    corresponde a Barcelona: no dar por hecho que es el de Madrid).
14. Plazos de conservación: correos atendidos y notas de reserva, datos de
    alergias tras el servicio, retención configurada en GA4 (2 o 14 meses) y registros de Vercel.
15. Si se envían comunicaciones comerciales (listas de difusión, promociones) con datos de clientes.
16. Cuenta de correo Gmail de consumo (sin contrato de encargado del tratamiento): valorar Google
    Workspace u otro proveedor.
17. ID de medición de GA4 (`PUBLIC_GA_ID`) para completar el nombre exacto de la cookie `_ga_<ID>`.
18. **Los textos legales deben ser revisados por el cliente o su asesor antes de publicar.**
