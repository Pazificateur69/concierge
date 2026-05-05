import { createI18n } from 'vue-i18n';

const messages = {
  fr: {
    home: { welcome: 'Bienvenue', subtitle: 'Comment vous orienter ?' },
    nav: { back: 'Retour', home: 'Accueil' },
    cards: {
      map: 'Carte locale',
      services: 'Services',
      menu: 'Restaurant',
      spa: 'Spa',
      weather: 'Météo',
      help: 'Aide',
    },
    map: {
      title: 'Carte locale',
      filters: 'Filtres',
      itinerary: 'Itinéraire',
      categories: {
        restaurant: 'Restaurants',
        monument: 'Monuments',
        museum: 'Musées',
        transport: 'Transports',
        shopping: 'Shopping',
        park: 'Parcs',
        bar: 'Bars',
        pharmacy: 'Pharmacies',
      },
    },
    voice: { on: 'Voix activée', off: 'Voix désactivée' },
  },
  en: {
    home: { welcome: 'Welcome', subtitle: 'How can we help?' },
    nav: { back: 'Back', home: 'Home' },
    cards: {
      map: 'Local map',
      services: 'Services',
      menu: 'Restaurant',
      spa: 'Spa',
      weather: 'Weather',
      help: 'Help',
    },
    map: {
      title: 'Local map',
      filters: 'Filters',
      itinerary: 'Directions',
      categories: {
        restaurant: 'Restaurants',
        monument: 'Monuments',
        museum: 'Museums',
        transport: 'Transport',
        shopping: 'Shopping',
        park: 'Parks',
        bar: 'Bars',
        pharmacy: 'Pharmacies',
      },
    },
    voice: { on: 'Voice on', off: 'Voice off' },
  },
  de: {
    home: { welcome: 'Willkommen', subtitle: 'Wie können wir helfen?' },
    nav: { back: 'Zurück', home: 'Startseite' },
    cards: {
      map: 'Stadtplan',
      services: 'Service',
      menu: 'Restaurant',
      spa: 'Spa',
      weather: 'Wetter',
      help: 'Hilfe',
    },
    map: { title: 'Stadtplan', filters: 'Filter', itinerary: 'Route', categories: {} },
    voice: { on: 'Stimme an', off: 'Stimme aus' },
  },
  es: {
    home: { welcome: 'Bienvenido', subtitle: '¿Cómo podemos ayudar?' },
    nav: { back: 'Atrás', home: 'Inicio' },
    cards: { map: 'Mapa local', services: 'Servicios', menu: 'Restaurante', spa: 'Spa', weather: 'Tiempo', help: 'Ayuda' },
    map: { title: 'Mapa local', filters: 'Filtros', itinerary: 'Ruta', categories: {} },
    voice: { on: 'Voz activada', off: 'Voz desactivada' },
  },
  jp: {
    home: { welcome: 'ようこそ', subtitle: 'どのようにお手伝いしましょうか？' },
    nav: { back: '戻る', home: 'ホーム' },
    cards: { map: '地図', services: 'サービス', menu: 'レストラン', spa: 'スパ', weather: '天気', help: 'ヘルプ' },
    map: { title: '地図', filters: 'フィルター', itinerary: '案内', categories: {} },
    voice: { on: '音声オン', off: '音声オフ' },
  },
};

const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || 'fr';

export const i18n = createI18n({
  legacy: false,
  locale: stored,
  fallbackLocale: 'fr',
  messages,
});

export const SUPPORTED_LANGS = [
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'jp', label: '🇯🇵 JP' },
];
