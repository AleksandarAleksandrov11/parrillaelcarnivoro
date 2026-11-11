# Créditos y licencias

Este documento recoge el origen y la licencia de cada recurso de la web. Se ha priorizado
siempre el material real del restaurante; ningún recurso externo se presenta como un plato
o un rincón concreto del local.

## Recursos externos

| Recurso | Uso en la web | Autor / origen | Licencia |
|---|---|---|---|
| Vídeo «carne en la parrilla» (`source-assets/wp-uploads/2023/03/pexels-denys-gromov-6577409.mp4`) | Fondo del hero de la home (`public/video/hero-*.mp4/webm`) y su póster (`src/assets/photos/hero-parrilla-carbon-poster*.jpg`), imagen OG de la home | Denys Gromov en Pexels — https://www.pexels.com/video/6577409/ (ya se usaba en la web anterior) | [Licencia de Pexels](https://www.pexels.com/license/): uso comercial gratuito, sin atribución obligatoria |
| Cormorant Garamond (tipografía) | Titulares | Christian Thalmann / The Cormorant Project (vía Fontsource) | SIL Open Font License 1.1 |
| Manrope (tipografía) | Texto e interfaz | Mikhail Sharanda (vía Fontsource) | SIL Open Font License 1.1 |
| Lenis (librería JS) | Scroll suave en escritorio | darkroom.engineering | MIT |
| Coordenadas del edificio (Pasaje Piscina Delfe, 3) | `geo` del schema | © colaboradores de OpenStreetMap | ODbL 1.0 (dato factual) |

Las texturas de fondo (grano, papel, madera, pizarra) se generan por código
(`scripts/make-textures.mjs`, ruido `feTurbulence`) y no proceden de ningún banco de imágenes.
Los iconos SVG de la interfaz se han dibujado para este proyecto (`src/components/Icon.astro`).

No se han usado fotos de Unsplash ni de otros bancos: no ha hecho falta.

## Material propio del restaurante

Procede de la web anterior (WordPress, copia de seguridad aportada por el cliente) y del propio
restaurante. Titular: Ivosi 2022, S.L.

- Logotipo e icono: `source-assets/wp-uploads/2023/02/Logotipo-elcarnivoro-blanco.png`,
  `Logotipo-negro-150px-carnivoro.png`, `icono-el-carnivoro.png`.
- Sesión de fotos del local y los platos (marzo de 2023): salón, fachada, barra, vinoteca,
  pizarra de cortes, carta, chuletón, entraña, bacalao, ensalada, chuletillas, arroz con leche, etc.
- Fotos del equipo (WhatsApp, mayo y diciembre de 2023): terraza, parrilla, T-Bone, paletilla,
  contramuslo, hamburguesas, gambones, provolone, parrillada de verduras, postres…
- Vídeo real de las brasas (`VID-20231219-WA0056.mp4`, diciembre de 2023), usado como clip
  ambiental en «Nuestra historia».

Las fotos de WhatsApp se han retocado de forma sutil (niveles, saturación y enfoque) y se
han eliminado sus metadatos (incluida la geolocalización). Se han descartado las fotos con
personas reconocibles, las borrosas o repetidas y las que muestran marcas comerciales
destacadas.

## Material de la web anterior que NO se usa

La copia de seguridad incluía imágenes de stock o de plantillas de licencia desconocida
(`cabecera-inicio-*.jpg`, `fondo-carta*.jpg`, `horquilla-trozos-…jpg`, `croquetas-elcarnivoro*.jpg`,
`fondo-uvas-vinos.jpg`, `parrilladas.jpg`, `surtido-deliciosos-desayunos.jpg`, `COCKTAILS.jpg`,
`parrilla-variedad-carnes*.jpg`, ilustraciones de fondo y las imágenes de demostración del tema
Divi). Se conservan en `source-assets/` por si el cliente acredita su licencia, pero no se
publican en la nueva web.
