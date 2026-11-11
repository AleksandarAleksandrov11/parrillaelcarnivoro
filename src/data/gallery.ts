/**
 * Galería de fotos (página /galeria/). Solo fotos reales del restaurante (sesión de 2023 y fotos
 * del equipo de diciembre de 2023). Se han descartado las fotos borrosas, repetidas,
 * con personas reconocibles o con marcas comerciales destacadas.
 */
import type { PhotoName } from './photos';

export type GalleryCategory = 'platos' | 'local' | 'terraza' | 'parrilla';

export const galleryCategories: { id: GalleryCategory; label: string }[] = [
  { id: 'platos', label: 'Platos' },
  { id: 'local', label: 'Local' },
  { id: 'terraza', label: 'Terraza' },
  { id: 'parrilla', label: 'Parrilla' },
];

export interface GalleryItem {
  photo: PhotoName;
  alt: string;
  category: GalleryCategory;
  /** Aparece en la selección de la home. */
  featured?: boolean;
  /** Forma en la composición destacada de la home (std o wide). */
  featuredShape?: 'std' | 'wide';
}

export const gallery: GalleryItem[] = [
  { photo: 'parrilla-carbon-carnes-el-carnivoro', category: 'parrilla', featured: true, featuredShape: 'wide', alt: 'La parrilla de carbón de El Carnívoro cargada de carnes al fuego' },
  { photo: 'salon-restaurante-el-carnivoro-collado-villalba', category: 'local', featured: true, alt: 'Salón del restaurante con mesas de madera, pared de ladrillo y lámparas de luz cálida' },
  { photo: 'chuleton-tomahawk-el-carnivoro', category: 'platos', featured: true, alt: 'Chuletón con hueso a la brasa sobre pizarra con patatas y verduras asadas' },
  { photo: 'terraza-cubierta-el-carnivoro', category: 'terraza', featured: true, featuredShape: 'wide', alt: 'Gran terraza cubierta con pérgola de madera y un mural de paisaje de sierra' },
  { photo: 'gambon-brasa-el-carnivoro', category: 'platos', featured: true, alt: 'Gambones a la brasa dispuestos en círculo alrededor de medio limón' },
  { photo: 'vinoteca-restaurante-el-carnivoro', category: 'local', alt: 'Vinoteca con botelleros de madera junto a la pared de ladrillo visto' },
  { photo: 't-bone-brasa-el-carnivoro', category: 'platos', featured: true, alt: 'T-Bone a la brasa servido sobre pizarra con ensalada de patata' },
  { photo: 'chuleton-parrilla-carbon-el-carnivoro', category: 'platos', alt: 'Chuletón a la parrilla de carbón trinchado sobre pizarra' },
  { photo: 'fachada-terraza-exterior-el-carnivoro', category: 'terraza', alt: 'Fachada de El Carnívoro con el escaparate y las mesas de la terraza exterior' },
  { photo: 'entrana-parrilla-el-carnivoro', category: 'platos', alt: 'Entraña a la brasa cortada en lonchas, jugosa y rosada por dentro' },
  { photo: 'barra-restaurante-el-carnivoro', category: 'local', alt: 'Barra del restaurante con botellero iluminado y plantas colgantes' },
  { photo: 'provolone-cazuela-el-carnivoro', category: 'platos', alt: 'Provolone a la cazuela gratinado con orégano en cazuela de barro' },
  { photo: 'terraza-mural-sierra-el-carnivoro', category: 'terraza', alt: 'Mesas de la terraza cubierta bajo la pérgola, con el mural de la sierra al fondo' },
  { photo: 'carnes-brasa-pizarra-el-carnivoro', category: 'parrilla', alt: 'Dos tablas de pizarra con carnes a la brasa recién cortadas' },
  { photo: 'bacalao-ajoarriero-el-carnivoro', category: 'platos', alt: 'Bacalao al ajoarriero gratinado servido en plato blanco' },
  { photo: 'pizarra-cortes-carne-el-carnivoro', category: 'local', alt: 'Pizarra con el despiece de la vaca y los cortes de la casa' },
  { photo: 'chuletillas-cordero-el-carnivoro', category: 'platos', alt: 'Chuletillas de cordero a la brasa sobre pizarra con romero' },
  { photo: 'paletilla-cordero-asada-el-carnivoro', category: 'parrilla', alt: 'Paletilla de cordero asada, dorada y recién salida del horno' },
  { photo: 'ensalada-queso-cabra-el-carnivoro', category: 'platos', alt: 'Ensalada fresca con queso de cabra, tomate y frutos secos' },
  { photo: 'carta-el-carnivoro-mesa', category: 'local', alt: 'Carta de El Carnívoro sobre la mesa con el lema «La mejor carne de la sierra»' },
  { photo: 'hamburguesa-el-carnivoro', category: 'platos', alt: 'Dos hamburguesas con huevo frito y patatas listas para servir' },
  { photo: 'terraza-cubierta-mesas-el-carnivoro', category: 'terraza', alt: 'Vista general de la terraza cubierta con mesas preparadas' },
  { photo: 'contramuslo-pollo-parrilla-el-carnivoro', category: 'parrilla', alt: 'Contramuslo de pollo a la parrilla con patatas y salsa barbacoa' },
  { photo: 'morcilla-brasa-huevos-el-carnivoro', category: 'platos', alt: 'Morcilla a la brasa con huevos fritos y patatas' },
  { photo: 'crepe-tarta-queso-el-carnivoro', category: 'platos', alt: 'Crepe con nata y chocolate junto a una porción de tarta de queso' },
  { photo: 'fachada-calle-restaurante-el-carnivoro', category: 'local', alt: 'Entrada del restaurante El Carnívoro en el Pasaje Piscina Delfe' },
  { photo: 'parrillada-verduras-el-carnivoro', category: 'parrilla', alt: 'Verduras de temporada asadas a la parrilla' },
  { photo: 'arroz-con-leche-el-carnivoro', category: 'platos', alt: 'Arroz con leche casero con canela en cazuela de barro' },
  { photo: 'pescado-brasa-ensalada-el-carnivoro', category: 'platos', alt: 'Pescado a la brasa con ensalada fresca' },
  { photo: 'postre-casero-el-carnivoro', category: 'platos', alt: 'Postre casero servido en plato rectangular sobre la mesa' },
];
