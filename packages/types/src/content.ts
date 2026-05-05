import { LocalizedString } from './common';

export type ContentBlockType =
  | 'hero'
  | 'cards'
  | 'map'
  | 'gallery'
  | 'pdf'
  | 'weather'
  | 'text'
  | 'video';

export interface ContentBlockBase {
  id: string;
  type: ContentBlockType;
  order: number;
}

export interface HeroBlock extends ContentBlockBase {
  type: 'hero';
  payload: {
    headline: LocalizedString;
    subline?: LocalizedString;
    image: string;
    ctaLabel?: LocalizedString;
    ctaTarget?: string;
  };
}

export interface CardItem {
  icon?: string;
  image?: string;
  title: LocalizedString;
  description?: LocalizedString;
  target?: string;
}

export interface CardsBlock extends ContentBlockBase {
  type: 'cards';
  payload: {
    columns: 2 | 3 | 4;
    items: CardItem[];
  };
}

export interface MapBlock extends ContentBlockBase {
  type: 'map';
  payload: {
    center: [number, number];
    zoom: number;
    poiCategories?: PoiCategory[];
  };
}

export interface GalleryBlock extends ContentBlockBase {
  type: 'gallery';
  payload: { images: { url: string; caption?: LocalizedString }[] };
}

export interface TextBlock extends ContentBlockBase {
  type: 'text';
  payload: { content: LocalizedString };
}

export type ContentBlock = HeroBlock | CardsBlock | MapBlock | GalleryBlock | TextBlock;

export type PoiCategory =
  | 'restaurant'
  | 'monument'
  | 'museum'
  | 'transport'
  | 'shopping'
  | 'park'
  | 'bar'
  | 'pharmacy';

export interface Poi {
  id: string;
  tenantId: string;
  name: LocalizedString;
  category: PoiCategory;
  lat: number;
  lng: number;
  description?: LocalizedString;
  photo?: string;
  rating?: number;
  hours?: string;
  phone?: string;
  website?: string;
  distanceMeters?: number;
}

export interface ContentPage {
  id: string;
  tenantId: string;
  slug: string;
  title: LocalizedString;
  blocks: ContentBlock[];
  published: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
