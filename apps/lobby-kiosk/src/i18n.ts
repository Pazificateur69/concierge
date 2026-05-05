import { createI18n } from 'vue-i18n';

const messages = {
  fr: {
    home: {
      welcome: 'Bienvenue à',
      subtitle: 'Découvrez votre séjour, explorez les services et la ville.',
      exploreLabel: 'Que souhaitez-vous découvrir ?',
      discover: 'Découvrir',
    },
    nav: { back: 'Retour', home: 'Accueil' },
    cards: {
      map: 'Carte locale', mapDesc: 'Restaurants, musées et monuments à proximité.',
      services: 'Services', servicesDesc: 'Conciergerie, taxi, pressing, room service…',
      menu: 'Restaurant', menuDesc: 'Carte du restaurant et room service 24h/24.',
      spa: 'Spa & Bien-être', spaDesc: 'Massages, soins, hammam — réservation directe.',
      weather: 'Météo & Activités', weatherDesc: 'Prévisions et idées pour la journée.',
      help: 'Aide', helpDesc: 'Contactez la réception ou un concierge.',
    },
    map: {
      title: 'Carte locale',
      subtitle: 'Découvrez le quartier en un coup d\'œil',
      filters: 'Catégories',
      showAll: 'Tout afficher',
      itinerary: 'Voir l\'itinéraire',
      categories: {
        restaurant: 'Restaurants', monument: 'Monuments', museum: 'Musées',
        transport: 'Transport', shopping: 'Shopping', park: 'Parcs',
        bar: 'Bars', pharmacy: 'Pharmacies',
      },
      empty: 'Sélectionnez un point sur la carte pour voir les détails.',
    },
    menu: {
      title: 'Restaurant & Room Service',
      subtitle: 'Commandez directement en chambre',
      categories: {
        food: 'Restauration', drink: 'Boissons', spa: 'Spa', taxi: 'Taxi',
        wakeup: 'Réveil', housekeeping: 'Service de chambre', other: 'Autres',
      },
      orderLabel: 'Votre commande',
      empty: 'Votre panier est vide. Sélectionnez un plat pour commencer.',
      total: 'Total',
      roomNumber: 'Numéro de chambre',
      submit: 'Envoyer la commande',
      submitting: 'Envoi en cours...',
      success: 'Commande confirmée !',
      successDesc: 'Votre commande arrivera en chambre dans 15 à 20 minutes.',
      newOrder: 'Nouvelle commande',
    },
    services: {
      title: 'Services à votre disposition',
      subtitle: 'Notre équipe est joignable 24h/24',
    },
    help: {
      title: 'Besoin d\'assistance ?',
      subtitle: 'Notre équipe est là pour vous',
      reception: 'Réception', email: 'Email', address: 'Adresse',
      open24: 'Ouvert 24h/24',
    },
    voice: { on: 'Voix activée', off: 'Voix désactivée' },
  },
  en: {
    home: {
      welcome: 'Welcome to',
      subtitle: 'Discover your stay, explore services and the city.',
      exploreLabel: 'What would you like to discover?',
      discover: 'Discover',
    },
    nav: { back: 'Back', home: 'Home' },
    cards: {
      map: 'Local map', mapDesc: 'Restaurants, museums and landmarks nearby.',
      services: 'Services', servicesDesc: 'Concierge, taxi, laundry, room service…',
      menu: 'Restaurant', menuDesc: '24/7 restaurant menu and room service.',
      spa: 'Spa & Wellness', spaDesc: 'Massages, treatments, hammam — book direct.',
      weather: 'Weather & Activities', weatherDesc: 'Forecast and ideas for your day.',
      help: 'Help', helpDesc: 'Reach reception or a concierge.',
    },
    map: {
      title: 'Local map', subtitle: 'Explore the neighbourhood at a glance',
      filters: 'Categories', showAll: 'Show all', itinerary: 'Get directions',
      categories: {
        restaurant: 'Restaurants', monument: 'Monuments', museum: 'Museums',
        transport: 'Transport', shopping: 'Shopping', park: 'Parks',
        bar: 'Bars', pharmacy: 'Pharmacies',
      },
      empty: 'Tap a marker to see details.',
    },
    menu: {
      title: 'Restaurant & Room Service', subtitle: 'Order straight to your room',
      categories: { food: 'Food', drink: 'Drinks', spa: 'Spa', taxi: 'Taxi', wakeup: 'Wake-up', housekeeping: 'Housekeeping', other: 'Other' },
      orderLabel: 'Your order', empty: 'Your basket is empty.', total: 'Total',
      roomNumber: 'Room number', submit: 'Place order', submitting: 'Sending...',
      success: 'Order confirmed!', successDesc: 'Your order will arrive in 15–20 minutes.', newOrder: 'New order',
    },
    services: { title: 'Services at your disposal', subtitle: 'Our team is available 24/7' },
    help: { title: 'Need help?', subtitle: 'Our team is here for you', reception: 'Reception', email: 'Email', address: 'Address', open24: 'Open 24/7' },
    voice: { on: 'Voice on', off: 'Voice off' },
  },
  de: {
    home: { welcome: 'Willkommen im', subtitle: 'Entdecken Sie Ihren Aufenthalt.', exploreLabel: 'Was möchten Sie entdecken?', discover: 'Entdecken' },
    nav: { back: 'Zurück', home: 'Startseite' },
    cards: {
      map: 'Stadtplan', mapDesc: 'Restaurants und Sehenswürdigkeiten in der Nähe.',
      services: 'Service', servicesDesc: 'Concierge, Taxi, Wäscherei, Roomservice…',
      menu: 'Restaurant', menuDesc: 'Speisekarte und 24h Roomservice.',
      spa: 'Spa & Wellness', spaDesc: 'Massagen, Behandlungen, Hammam.',
      weather: 'Wetter & Aktivitäten', weatherDesc: 'Vorhersage und Ideen.',
      help: 'Hilfe', helpDesc: 'Kontaktieren Sie die Rezeption.',
    },
    map: { title: 'Stadtplan', subtitle: 'Stadtviertel auf einen Blick', filters: 'Kategorien', showAll: 'Alle', itinerary: 'Route', categories: {}, empty: 'Wählen Sie einen Punkt aus.' },
    menu: { title: 'Restaurant & Roomservice', subtitle: 'Bestellen Sie ins Zimmer', categories: {}, orderLabel: 'Ihre Bestellung', empty: 'Leer.', total: 'Gesamt', roomNumber: 'Zimmernummer', submit: 'Bestellen', submitting: 'Wird gesendet...', success: 'Bestätigt!', successDesc: 'Ihre Bestellung kommt in 15–20 Min.', newOrder: 'Neu' },
    services: { title: 'Service', subtitle: '24/7 verfügbar' },
    help: { title: 'Hilfe?', subtitle: 'Wir sind für Sie da', reception: 'Rezeption', email: 'E-Mail', address: 'Adresse', open24: '24/7 geöffnet' },
    voice: { on: 'Stimme an', off: 'Stimme aus' },
  },
  es: {
    home: { welcome: 'Bienvenido al', subtitle: 'Descubra su estancia.', exploreLabel: '¿Qué desea descubrir?', discover: 'Descubrir' },
    nav: { back: 'Atrás', home: 'Inicio' },
    cards: {
      map: 'Mapa local', mapDesc: 'Restaurantes y monumentos cercanos.',
      services: 'Servicios', servicesDesc: 'Conserjería, taxi, lavandería…',
      menu: 'Restaurante', menuDesc: 'Carta y room service 24h.',
      spa: 'Spa & Bienestar', spaDesc: 'Masajes, tratamientos.',
      weather: 'Tiempo & Actividades', weatherDesc: 'Pronóstico e ideas.',
      help: 'Ayuda', helpDesc: 'Contacte recepción.',
    },
    map: { title: 'Mapa local', subtitle: 'El barrio de un vistazo', filters: 'Categorías', showAll: 'Todo', itinerary: 'Ver ruta', categories: {}, empty: 'Seleccione un punto.' },
    menu: { title: 'Restaurante & Room service', subtitle: 'Pida a su habitación', categories: {}, orderLabel: 'Su pedido', empty: 'Vacío.', total: 'Total', roomNumber: 'Habitación', submit: 'Pedir', submitting: 'Enviando...', success: '¡Confirmado!', successDesc: 'Llegará en 15–20 min.', newOrder: 'Nuevo' },
    services: { title: 'Servicios', subtitle: 'Disponible 24/7' },
    help: { title: '¿Ayuda?', subtitle: 'Estamos para usted', reception: 'Recepción', email: 'Email', address: 'Dirección', open24: 'Abierto 24/7' },
    voice: { on: 'Voz activada', off: 'Voz desactivada' },
  },
  jp: {
    home: { welcome: 'ようこそ', subtitle: 'ご滞在をお楽しみください', exploreLabel: '何を発見したいですか？', discover: '発見' },
    nav: { back: '戻る', home: 'ホーム' },
    cards: {
      map: '地図', mapDesc: '近くのレストランや観光地。',
      services: 'サービス', servicesDesc: 'コンシェルジュ、タクシー、ルームサービス…',
      menu: 'レストラン', menuDesc: 'レストランメニューと24時間ルームサービス。',
      spa: 'スパ', spaDesc: 'マッサージとトリートメント。',
      weather: '天気と活動', weatherDesc: '予報とアイデア。',
      help: 'ヘルプ', helpDesc: 'フロントにご連絡ください。',
    },
    map: { title: '地図', subtitle: '近隣を一望', filters: 'カテゴリ', showAll: 'すべて', itinerary: '経路', categories: {}, empty: 'マーカーをタップ。' },
    menu: { title: 'レストラン', subtitle: 'お部屋へお届け', categories: {}, orderLabel: 'ご注文', empty: '空', total: '合計', roomNumber: '部屋番号', submit: '注文', submitting: '送信中...', success: '確定！', successDesc: '15-20分でお届け。', newOrder: '新規' },
    services: { title: 'サービス', subtitle: '24時間ご利用いただけます' },
    help: { title: 'ヘルプ', subtitle: 'お手伝いします', reception: 'フロント', email: 'メール', address: '住所', open24: '24時間営業' },
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
  { code: 'fr', label: '🇫🇷' },
  { code: 'en', label: '🇬🇧' },
  { code: 'de', label: '🇩🇪' },
  { code: 'es', label: '🇪🇸' },
  { code: 'jp', label: '🇯🇵' },
];
