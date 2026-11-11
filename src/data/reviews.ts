/**
 * Opiniones reales publicadas en la home de la web anterior (junto a las estrellas de
 * Google). Se reproducen tal cual, solo recortadas para su lectura en la web.
 * TODO: confirmar con el cliente la fuente exacta (Google) y si se puede mostrar el nombre de cada autor.
 *
 * Importante: no se usan en el schema (Google no admite reseñas autogestionadas en negocios locales).
 */
export interface Review {
  /** Frase destacada (fragmento literal). */
  highlight: string;
  /** Texto completo o recortado (literal). */
  text: string;
  tags: string[];
}

export const reviews: Review[] = [
  {
    highlight: 'Ha sido una experiencia genial.',
    text: 'Fuimos 5 y empezamos con unas croquetas caseras (increíblemente buenas), unos torreznos y un plato con chistorra, criollo y morcilla (todo buenísimo). Luego pedimos chuletón de vaca gallega para 2 (un sabor espectacular), lomo alto para otros 2 (trinchado y con un punto perfecto) y entrecot […]. La atención inmejorable, gente muy, muy agradable y un ambiente estupendo. Estoy deseando ir con el buen tiempo para disfrutar de la terraza.',
    tags: ['Chuletón', 'Croquetas caseras', 'Atención'],
  },
  {
    highlight: 'Con la bebida ponen tapa, lo cual está muy bien.',
    text: 'Restaurante amplio, con terraza interior y exterior y con una buena relación calidad-precio. La atención bastante buena. Nosotros pedimos la parrillada para dos y salimos satisfechos […]. Con la bebida ponen tapa, lo cual está muy bien.',
    tags: ['Terraza', 'Calidad-precio', 'Tapa con la bebida'],
  },
  {
    highlight: 'El torrezno estaba espectacular.',
    text: 'El otro día volví a comer con un amigo, la ensalada de tomate está buenísima, la parrillada de carne, muy muy buena. Pero el torrezno estaba espectacular.',
    tags: ['Torreznos', 'Parrillada'],
  },
];
