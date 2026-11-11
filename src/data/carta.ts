/**
 * CARTA DE EL CARNÍVORO — archivo único de datos.
 *
 * Para cambiar un precio, un plato o una descripción basta con editar este archivo
 * (no hace falta tocar ningún componente). Los precios van en euros con IVA incluido
 * y se escriben como número: 14.5 se mostrará como «14,50 €».
 *
 * Fuente: «Para_APROBAR2.pdf» (carta nueva, noviembre 2026). Desayunos, menú del día
 * y menú de grupos no aparecen en el PDF: se toman de la web anterior y están marcados
 * con `pendingConfirmation` para revisarlos con el cliente.
 */
import type { PhotoName } from './photos';

export type Unit = 'kg' | 'unidad' | 'persona';

export interface Price {
  amount: number;
  /** Precio por kilo, por unidad o por persona. */
  per?: Unit;
  /** Etiqueta opcional (p. ej. «Copa», «Botella»). */
  label?: string;
}

export interface MenuItem {
  name: string;
  description?: string;
  prices: Price[];
  /** Nota corta destacada (p. ej. «Con reserva previa»). */
  note?: string;
  /** Códigos de alérgenos (Reglamento UE 1169/2011). El PDF no los detalla. */
  allergens?: string[];
}

export interface ItemGroup {
  /** Subtítulo del grupo (p. ej. «D.O. Ribera del Duero»). */
  title?: string;
  items: MenuItem[];
}

export interface Course {
  title: string;
  /** Aclaración (p. ej. «Para compartir cada 4 personas»). */
  hint?: string;
  options: string[];
}

export interface SetMenu {
  name: string;
  price: Price;
  courses: Course[];
  includes?: string[];
}

interface SectionBase {
  /** Ancla de la sección: /carta/#id */
  id: string;
  title: string;
  /** Antetítulo corto. */
  kicker: string;
  intro?: string;
  photo: PhotoName;
  photoAlt: string;
  notes?: string[];
  /** Datos que conviene confirmar con el cliente (se listan en el README/QA). */
  pendingConfirmation?: string;
}

export interface CartaSection extends SectionBase {
  kind: 'carta';
  groups: ItemGroup[];
  /** Columnas de precio (vinos: copa y botella). */
  priceColumns?: string[];
}

export interface MenuSection extends SectionBase {
  kind: 'menu';
  menus: SetMenu[];
  /** Información de disponibilidad (días, horario). */
  availability?: string;
  link?: { href: string; label: string };
}

export type Section = CartaSection | MenuSection;

const RESERVA = 'Con reserva previa';

export const carta: Section[] = [
  {
    kind: 'carta',
    id: 'ensaladas',
    title: 'Ensaladas',
    kicker: 'Frescas de temporada',
    intro: 'El contrapunto fresco a la brasa.',
    photo: 'ensalada-queso-cabra-el-carnivoro',
    photoAlt: 'Ensalada de lechuga, tomate y queso de cabra con frutos secos sobre mesa de madera',
    groups: [
      {
        items: [
          { name: 'Pimiento o tomate con ventresca', prices: [{ amount: 16 }] },
          { name: 'Caprese con aguacate', prices: [{ amount: 17 }] },
          {
            name: 'Carnívoro',
            description: 'Con lechuga, tomate, cebolla morada, huevo cocido, queso de cabra, cecina y almendra tostada.',
            prices: [{ amount: 18 }],
          },
        ],
      },
    ],
  },
  {
    kind: 'carta',
    id: 'entrantes',
    title: 'Entrantes',
    kicker: 'Para abrir boca',
    intro: 'Croquetas caseras, embutidos a la brasa y clásicos para compartir mientras se prepara el fuego.',
    photo: 'provolone-cazuela-el-carnivoro',
    photoAlt: 'Provolone a la cazuela gratinado con orégano, servido en cazuela de barro',
    groups: [
      {
        items: [
          { name: 'Croquetas de jamón, boletus o rabo de toro', prices: [{ amount: 14.5 }] },
          { name: 'Huevos rotos con jamón y trufa', prices: [{ amount: 17 }] },
          { name: 'Queso rebozado', prices: [{ amount: 16 }] },
          { name: 'Provolone a la cazuela', prices: [{ amount: 15 }] },
          { name: 'Lacón a la brasa', prices: [{ amount: 16 }] },
          { name: 'Oreja a la plancha', prices: [{ amount: 14 }] },
          { name: 'Flor de alcachofa con jamón o aceite de trufa', prices: [{ amount: 4.5, per: 'unidad' }] },
          { name: 'Torreznos «Carnívoro»', prices: [{ amount: 16 }] },
          { name: 'Jamón ibérico', prices: [{ amount: 26 }] },
          { name: 'Morcilla de Burgos a la brasa', prices: [{ amount: 5, per: 'unidad' }] },
          { name: 'Chorizo criollo', prices: [{ amount: 3.5, per: 'unidad' }] },
          { name: 'Chorizo parrillero', prices: [{ amount: 3.5, per: 'unidad' }] },
        ],
      },
    ],
  },
  {
    kind: 'carta',
    id: 'carnes',
    title: 'Carnes a la brasa o parrilla',
    kicker: 'Parrilla de carbón',
    intro: 'Nuestro oficio: cortes seleccionados, brasa de carbón y el punto exacto. Las piezas grandes se sirven al peso.',
    photo: 'chuleton-parrilla-carbon-el-carnivoro',
    photoAlt: 'Chuletón a la parrilla de carbón trinchado sobre pizarra con guarnición de patatas',
    notes: ['Los cortes marcados «con reserva previa» deben encargarse al reservar.'],
    groups: [
      {
        items: [
          { name: 'Chuletón', prices: [{ amount: 48, per: 'kg' }] },
          { name: 'T-Bone', prices: [{ amount: 52, per: 'kg' }] },
          { name: 'Entrecot', prices: [{ amount: 27 }] },
          { name: 'Solomillo', prices: [{ amount: 28 }] },
          { name: 'Steak Ribeye', note: RESERVA, prices: [{ amount: 80, per: 'kg' }] },
          { name: 'Chuletón madurado de vaca', note: RESERVA, prices: [{ amount: 95, per: 'kg' }] },
          { name: 'Tomahawk', note: RESERVA, prices: [{ amount: 100, per: 'kg' }] },
          { name: 'Paletilla de cordero', note: RESERVA, prices: [{ amount: 36 }] },
          { name: 'Tira de asado', prices: [{ amount: 20 }] },
          { name: 'Entraña', prices: [{ amount: 19 }] },
          { name: 'Picaña', prices: [{ amount: 20 }] },
          { name: 'Vacío', prices: [{ amount: 20 }] },
          { name: 'Secreto', prices: [{ amount: 17 }] },
          { name: 'Pluma ibérica', prices: [{ amount: 18 }] },
          { name: 'Contramuslo', prices: [{ amount: 16 }] },
          { name: 'Hamburguesa', prices: [{ amount: 16 }] },
        ],
      },
    ],
  },
  {
    kind: 'carta',
    id: 'pescados',
    title: 'Pescados',
    kicker: 'Del mar',
    intro: 'Para quien prefiere el mar: pulpo y gambón a la brasa, sepia a la plancha y bacalao al ajoarriero.',
    photo: 'gambon-brasa-el-carnivoro',
    photoAlt: 'Gambones a la brasa dispuestos en círculo alrededor de medio limón',
    groups: [
      {
        items: [
          { name: 'Bacalao al ajoarriero', prices: [{ amount: 20 }] },
          { name: 'Sepia a la plancha', prices: [{ amount: 18 }] },
          { name: 'Pulpo a la brasa', prices: [{ amount: 28 }] },
          { name: 'Gambón a la brasa', prices: [{ amount: 18 }] },
        ],
      },
    ],
  },
  {
    kind: 'carta',
    id: 'postres',
    title: 'Postres',
    kicker: 'El final dulce',
    photo: 'crepe-tarta-queso-el-carnivoro',
    photoAlt: 'Crepe con nata y chocolate y una porción de tarta de queso con mermelada de frutos rojos',
    groups: [
      {
        items: [
          { name: 'Crepes de chocolate o dulce de leche', prices: [{ amount: 6 }] },
          { name: 'Tarta de queso', prices: [{ amount: 6 }] },
          { name: 'Coulant de chocolate', prices: [{ amount: 6 }] },
          { name: 'Piña flambeada', prices: [{ amount: 6 }] },
        ],
      },
    ],
  },
  {
    kind: 'carta',
    id: 'vinos',
    title: 'Vinos',
    kicker: 'Bodega',
    intro: 'Una selección pensada para acompañar la brasa, por copa o por botella.',
    photo: 'vinoteca-restaurante-el-carnivoro',
    photoAlt: 'Vinoteca del restaurante con botelleros de madera y pared de ladrillo',
    priceColumns: ['Copa', 'Botella'],
    pendingConfirmation:
      'El PDF indica «D.O. Cueva» para el espumoso Alcardet Brut 18; confirmar la denominación correcta (¿D.O. Cava?) antes de mostrarla.',
    groups: [
      {
        title: 'Tintos · D.O. Ribera del Duero',
        items: [
          { name: 'Ricardo Dumas', description: 'Tempranillo', prices: [{ amount: 3.3, label: 'Copa' }, { amount: 19, label: 'Botella' }] },
          { name: 'Ricardo Dumas Crianza', description: 'Tinta del País', prices: [{ amount: 4, label: 'Copa' }, { amount: 24, label: 'Botella' }] },
          { name: 'Ricardo Dumas', description: 'Vendimia seleccionada 14 meses', prices: [{ amount: 27, label: 'Botella' }] },
          { name: 'Alvides Finca Mirabueno', description: 'Tinta del País', prices: [{ amount: 3.3, label: 'Copa' }, { amount: 19, label: 'Botella' }] },
        ],
      },
      {
        title: 'Tintos · D.O. Rioja',
        items: [
          { name: 'Muriel Crianza', description: 'Tempranillo', prices: [{ amount: 3.4, label: 'Copa' }, { amount: 20, label: 'Botella' }] },
          { name: 'Muriel Reserva', description: 'Tempranillo', prices: [{ amount: 4.5, label: 'Copa' }, { amount: 27, label: 'Botella' }] },
        ],
      },
      {
        title: 'Tintos · D.O. Madrid',
        items: [
          {
            name: 'Pago Vilches · Vino de la casa',
            description: 'Tempranillo, Merlot y Syrah',
            prices: [{ amount: 3, label: 'Copa' }, { amount: 17, label: 'Botella' }],
          },
        ],
      },
      {
        title: 'Blancos · D.O. Rueda / Verdejo',
        items: [
          { name: 'Hombre Pez', prices: [{ amount: 3.2, label: 'Copa' }, { amount: 18, label: 'Botella' }] },
          { name: 'Esencia 27', prices: [{ amount: 3.2, label: 'Copa' }, { amount: 18, label: 'Botella' }] },
        ],
      },
      {
        title: 'Blancos · D.O. Albariño / Rías Baixas',
        items: [{ name: 'Folklore de Pazo Cilleiro', prices: [{ amount: 3.2, label: 'Copa' }, { amount: 18, label: 'Botella' }] }],
      },
      {
        title: 'Blancos · D.O. Godello',
        items: [{ name: 'Luna Beberide', description: 'Bierzo', prices: [{ amount: 3.3, label: 'Copa' }, { amount: 19, label: 'Botella' }] }],
      },
      {
        title: 'Rosados · D.O. Castilla y León',
        items: [
          {
            name: 'Kapricho de la Viña',
            description: 'Prieto Picudo / Semidulce',
            prices: [{ amount: 3.2, label: 'Copa' }, { amount: 18, label: 'Botella' }],
          },
        ],
      },
      {
        // TODO: confirmar con el cliente. El PDF dice «D.O. Cueva» (¿errata de «D.O. Cava»?).
        title: 'Espumoso',
        items: [{ name: 'Alcardet Brut 18', description: 'Chardonnay y Macabeo', prices: [{ amount: 20, label: 'Botella' }] }],
      },
    ],
  },
  {
    kind: 'menu',
    id: 'menu-del-dia',
    title: 'Menú del día',
    kicker: 'Lunes, jueves y viernes',
    intro: 'Un menú que cambia cada día. Publicamos el de hoy en nuestro Instagram.',
    photo: 'pescado-brasa-ensalada-el-carnivoro',
    photoAlt: 'Plato de pescado a la brasa con ensalada servido en mesa de madera',
    availability: 'Lunes, jueves y viernes (martes y miércoles cerramos).',
    link: { href: 'https://www.instagram.com/elcarnivoro.villalba/', label: 'Ver el menú de hoy en Instagram' },
    pendingConfirmation:
      'No aparece en el PDF. Precio de la web anterior: 14,90 € de lunes a viernes (la antigua página de desayunos indicaba «plato del día 12 €»). Confirmar precio, días y si se mantiene el plato del día.',
    menus: [
      {
        name: 'Menú del día',
        price: { amount: 14.9, per: 'persona' },
        courses: [],
      },
    ],
  },
  {
    kind: 'menu',
    id: 'menu-cenas',
    title: 'Menú cenas y fines de semana',
    kicker: 'Noches y fines de semana',
    intro: 'Primeros, segundos y postres a elegir, con pan, una bebida y café o chupito incluidos.',
    photo: 'carnes-brasa-pizarra-el-carnivoro',
    photoAlt: 'Dos tablas de pizarra con carnes a la brasa recién cortadas y guarnición de patatas',
    availability: 'Cenas y fines de semana.',
    notes: ['Servicio/cubiertos (por comensal): 0,90 €.', 'IVA incluido.'],
    pendingConfirmation: 'Confirmar el horario exacto en el que se sirve (qué días y desde qué hora).',
    menus: [
      {
        name: 'Menú cenas y fines de semana',
        price: { amount: 32.5, per: 'persona' },
        courses: [
          {
            title: 'Primeros',
            options: [
              'Croquetas de jamón, de boletus o de rabo de toro',
              'Queso provolone',
              'Ensalada caprese',
              'Pimiento o tomate con atún',
              'Flor de alcachofa con jamón o aceite de trufa',
              'Lacón a la brasa',
              'Gambón a la plancha (4 uds.)',
            ],
          },
          {
            title: 'Segundos',
            options: ['Entrecot', 'Entraña', 'Picaña', 'Tira de asado', 'Presa ibérica', 'Contramuslo de pollo', 'Sepia', 'Lubina', 'Emperador'],
          },
          {
            title: 'Postres',
            options: ['Crepe de chocolate o dulce de leche', 'Tarta de queso', 'Coulant de chocolate', 'Helado de varios sabores'],
          },
        ],
        includes: ['Pan', '1 bebida', 'Café o chupito'],
      },
    ],
  },
  {
    kind: 'menu',
    id: 'grupos',
    title: 'Menú de grupos',
    kicker: 'Celebraciones · mínimo 4 personas',
    intro:
      'Primeros para compartir, un segundo por persona, pan, aperitivo, postre, una bebida por persona y café. Botella de vino cada 4 personas (Rueda, Ribera del Duero o Rioja) o una bebida por persona.',
    photo: 'parrilla-carbon-carnes-el-carnivoro',
    photoAlt: 'La parrilla de carbón de El Carnívoro llena de carnes para un grupo',
    notes: ['Servicio/cubierto (por comensal): 0,60 €.', 'IVA incluido.'],
    pendingConfirmation:
      'No aparece en el PDF; datos de la web anterior. Confirmar precios (39,50 € y 59,50 €), platos y el servicio/cubierto (0,60 € en grupos frente a 0,90 € en el menú de cenas).',
    menus: [
      {
        name: 'Menú 1',
        price: { amount: 39.5, per: 'persona' },
        courses: [
          { title: 'Primeros', hint: 'Para compartir cada 4 personas', options: ['2 entrantes de la carta a elegir'] },
          {
            title: 'Segundos',
            hint: 'Un plato a elegir por persona',
            options: ['Entrecot de vaca gallega', 'Contramuslo de pollo deshuesado a la parrilla', 'Bacalao al ajoarriero'],
          },
        ],
        includes: ['Pan', 'Aperitivo', 'Postre', '1 bebida por persona', 'Café'],
      },
      {
        name: 'Menú 2',
        price: { amount: 59.5, per: 'persona' },
        courses: [
          { title: 'Primeros', hint: 'Para compartir cada 4 personas', options: ['3 entrantes de la carta a elegir'] },
          {
            title: 'Segundos',
            hint: 'Un plato a elegir por persona',
            options: ['Solomillo de ternera a la brasa', 'Pulpo a la brasa', 'Paletilla de cordero asada'],
          },
        ],
        includes: ['Pan', 'Aperitivo', 'Postre', '1 bebida por persona', 'Café'],
      },
    ],
  },
  {
    kind: 'carta',
    id: 'desayunos',
    title: 'Desayunos',
    kicker: 'Desde las 10:00',
    intro: 'Empieza el día en la barra o en la terraza: tostadas, bocatas y café recién hecho.',
    photo: 'barra-restaurante-el-carnivoro',
    photoAlt: 'Barra del restaurante El Carnívoro con botellero, cafetera y plantas colgantes',
    notes: ['Suplemento de refresco en los desayunos: 1,00 €.', 'Suplemento de queso en sándwiches y bocatas: 0,50 €.'],
    pendingConfirmation: 'No aparecen en el PDF; precios de la web anterior. Confirmar carta y precios de desayunos.',
    groups: [
      {
        title: 'Desayunos',
        items: [
          { name: 'Tostada con tomate o mermelada', description: 'Con café o infusión', prices: [{ amount: 3 }] },
          { name: 'Tostada de jamón', description: 'Con café o infusión', prices: [{ amount: 4.5 }] },
          { name: 'Tortilla francesa', description: 'Con café o infusión', prices: [{ amount: 4.5 }] },
          {
            name: 'Desayuno completo',
            description: '2 huevos fritos, bacon, chistorra y pan tostado, con café o infusión',
            prices: [{ amount: 6.5 }],
          },
        ],
      },
      {
        title: 'Sándwiches y bocatas',
        items: [
          { name: 'Sándwich mixto con huevo', prices: [{ amount: 4.2 }] },
          { name: 'Bocatas fríos', description: 'Jamón, salchichón, chorizo o queso', prices: [{ amount: 5 }] },
          { name: 'Bocatas calientes', description: 'Lomo, bacon, chorizo o chistorra', prices: [{ amount: 6 }] },
        ],
      },
      {
        title: 'Bebidas',
        items: [
          { name: 'Café, vaso de leche, infusión o ColaCao', prices: [{ amount: 1.5 }] },
          { name: 'Zumos y refrescos', prices: [{ amount: 2.5 }] },
        ],
      },
    ],
  },
];

/** Notas generales de la carta (Reglamento UE 1169/2011 e IVA). */
export const cartaNotes = {
  allergens: 'Disponemos de información sobre alérgenos, consulte a nuestro personal.',
  vat: 'Todos los precios incluyen IVA.',
};

/** Orden de navegación: carta y, después, menús y desayunos. */
export const cartaNav = carta.map((s) => ({ id: s.id, label: navLabel(s) }));

function navLabel(s: Section): string {
  switch (s.id) {
    case 'carnes':
      return 'Carnes';
    case 'menu-cenas':
      return 'Menú cenas';
    case 'grupos':
      return 'Grupos';
    default:
      return s.title;
  }
}

export function getSection(id: string): Section {
  const s = carta.find((x) => x.id === id);
  if (!s) throw new Error(`Sección de carta desconocida: ${id}`);
  return s;
}
