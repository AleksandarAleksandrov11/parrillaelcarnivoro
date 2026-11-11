/**
 * Opiniones reales de clientes en Google (selección de las más positivas).
 *
 * Se reproducen literalmente; solo se han corregido espacios y alguna errata evidente, y
 * se recortan con «…» donde Google las corta. Del autor se muestra el nombre y la inicial
 * del apellido.
 *
 * Para añadir más: copia un bloque { … }. Solo `text` es obligatorio.
 *  - highlight: frase corta destacada, copiada literalmente de la reseña.
 *  - home:      true para que salga en la portada (se muestran las 3 primeras marcadas).
 *
 * Importante: no se usan en el schema (Google no admite reseñas autogestionadas en negocios locales).
 */
export interface Review {
  text: string;
  highlight?: string;
  author?: string;
  home?: boolean;
}

/** Resumen de la ficha de Google (lo indica el cliente; actualízalo de vez en cuando). */
export const googleRating = { score: '4,4', count: 'más de 350' } as const;

export const reviews: Review[] = [
  {
    author: 'Eva M.',
    highlight: 'Un restaurante súper recomendable.',
    text: 'Fuimos 3 parejas y todos coincidimos en que es un restaurante súper recomendable, carne y elaboración muy buena. Las crepes deliciosas, estábamos tan a gusto que decidimos incluso alargar la velada tomando una copa. Además los camareros son muy atentos y simpáticos, un gusto la verdad. Repetiremos sin duda.',
    home: true,
  },
  {
    author: 'Iris R.',
    highlight: 'De los mejores restaurantes de la zona.',
    text: 'La carne tiene una calidad excelente y los camareros súper atentos. Ponen unas tapas buenísimas, cosa la cual se ha perdido en muchos lados. 100% recomendado.',
    home: true,
  },
  {
    author: 'Veneta G.',
    highlight: 'Ha sido todo perfecto.',
    text: 'Hemos celebrado nuestra boda en el restaurante El Carnívoro y solo puedo decir que ha sido todo perfecto, empezando por el servicio profesional y la comida espectacular. Muy recomendable, sin duda nuestro restaurante favorito. ¡Gracias!',
    home: true,
  },
  {
    author: 'Alejandra S.',
    highlight: 'Uno de los mejores lugares para disfrutar de la mejor parrilla.',
    text: 'Lo descubrimos a través de una entrevista en la radio de la sierra y ha sido un gran acierto, recomendable el tomahawk […]. El servicio de 10, gracias por tan buena atención.',
  },
  {
    author: 'Antonia C.',
    highlight: 'Se come de maravilla.',
    text: 'Un sitio estupendo, se come de maravilla, rápido, producto de calidad. Fui con la familia y los niños encantados, cenamos de lujo como hacía tiempo. El personal un 10 y la dueña un 15. 100x100 recomendado, pronto estaremos por allí. Gracias.',
  },
  {
    author: 'Miriam B.',
    highlight: 'Una experiencia magnífica digna de repetirse.',
    text: 'Las raciones son abundantes y económicas, toda la comida está riquísima, la atención y el trato recibido no pudieron ser mejores, el ambiente es muy acogedor. Comer en el Carnívoro ha sido una experiencia magnífica digna de repetirse. Recalco el maravilloso trato recibido por parte de los camareros.',
  },
  {
    author: 'Lucía',
    highlight: 'Las carnes, un espectáculo.',
    text: 'El lugar es muy agradable y la comida excelente. La atención de Ibe y Rafa fue de lo mejor, así mismo las carnes hechas por Bobby un espectáculo. Fuimos por recomendación y no nos ha defraudado. Los recomiendo sin dudas y volveremos.',
  },
  {
    author: 'Julio G.',
    highlight: 'Te hacen sentir como en familia.',
    text: 'Calidad-precio espectacular, servicio muy agradable, te hacen sentir como en familia. Éramos 15 personas, comimos varios entrantes y diferentes carnes; entre ellas recomiendo la carne madurada y el tomahawk…',
  },
  {
    author: 'Miriam J.',
    highlight: 'Muy recomendable y muy buena calidad.',
    text: 'Estuvimos cenando en familia y todo súper bien, la comida riquísima y Alejandro el camarero súper amable y muy atento. Muy recomendable y muy buena calidad, sin duda volveremos.',
  },
  {
    author: 'Cristina F.',
    highlight: 'Nos sorprendió bastante.',
    text: 'Recomiendo este restaurante, la verdad que nos sorprendió bastante, muy buena calidad de comida y un servicio espectacular por parte de Pablo. ¡La semana que viene repetimos!',
  },
  {
    author: 'Manuel G.',
    highlight: 'La carne a la parrilla, genial.',
    text: 'Un trato espectacular y la comida de grandísima calidad. Hemos venido dos veces seguidas y las dos geniales. Buen precio y la carne a la parrilla genial.',
  },
  {
    author: 'Susana C.',
    highlight: 'Siempre pendientes de nosotros.',
    text: 'Muy buen lugar, tanto por la comida como por el trato. Siempre pendientes de nosotros y, además, como era la celebración de mi cumpleaños, hicieron todo lo posible y más para que mi familia me obsequiara con un detalle…',
  },
  {
    author: 'Karina C.',
    highlight: '¡Me encantó!',
    text: 'La entraña riquísima y la atención del camarero David, muy profesional. Los aperitivos estaban riquísimos, tanto como el pan…',
  },
  {
    author: 'Irene F.',
    highlight: 'Sitio para repetir sin lugar a dudas.',
    text: 'Todo estaba riquísimo, hemos pedido el menú del día y nos ha gustado mucho. Pero lo mejor, el trato de la camarera, que ha estado pendiente de nosotras en todo momento.',
  },
  {
    author: 'Valle G.',
    highlight: 'Estupenda comida y buen servicio.',
    text: 'Estupenda comida y, lo que es aún mejor, buen servicio. Alejandro súper amable y correcto. Ha sido una buena primera vez. Volveremos.',
  },
  {
    author: 'Carolina D.',
    highlight: 'El servicio al completo ha sido excelente.',
    text: 'Hemos comido en la terraza, el servicio al completo ha sido excelente. Tanto la atención de los camareros, que han sido muy agradables, como la comida. La hamburguesa muy buena.',
  },
  {
    author: 'Rosa C.',
    highlight: '¡Repetiremos!',
    text: 'La comida buenísima y el servicio muy amable y rápido. Nos han hecho buenas recomendaciones del menú.',
  },
  {
    author: 'Alfredo T.',
    highlight: 'Muy buena experiencia.',
    text: 'Muy buena comida. Excelente servicio. Precio ajustado. Muy buena experiencia.',
  },
];

export const homeReviews = reviews.filter((r) => r.home).slice(0, 3);
