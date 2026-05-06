/* Plain JS seed — runs anywhere with mongoose installed */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/concierge';

async function main() {
  console.log(`🌱 Seeding ${MONGO_URI.replace(/:[^:@]+@/, ':***@')}...`);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  for (const c of ['tenants', 'users', 'content_pages', 'pois', 'menu_items', 'surveys', 'survey_responses', 'orders']) {
    await db.collection(c).deleteMany({});
  }

  // ============== TENANTS ==============
  const royal = await db.collection('tenants').insertOne({
    slug: 'royal-lyon', name: 'Le Royal Lyon',
    theme: { primaryColor: '#1a4d8c', accentColor: '#d4a85a', bgColor: '#fafaf7', textColor: '#1a1d24',
      logoUrl: 'https://placehold.co/200x80/1a4d8c/d4a85a?text=ROYAL+LYON', font: 'Playfair Display' },
    contact: { phone: '04 78 28 00 00', email: 'reception@royal-lyon.fr', address: '15 Place Bellecour',
      city: 'Lyon', country: 'France', lat: 45.7578, lng: 4.832 },
    locales: ['fr', 'en', 'de', 'es', 'jp'], defaultLocale: 'fr',
    features: ['lobby', 'rooms', 'smiley', 'reception', 'analytics'],
    createdAt: new Date(), updatedAt: new Date(),
  });
  const azur = await db.collection('tenants').insertOne({
    slug: 'cote-azur', name: "Côte d'Azur Resort",
    theme: { primaryColor: '#0e7490', accentColor: '#fbbf24', bgColor: '#f8fafc', textColor: '#0f172a',
      logoUrl: 'https://placehold.co/200x80/0e7490/fbbf24?text=COTE+AZUR', font: 'Cormorant Garamond' },
    contact: { phone: '04 93 88 00 00', email: 'info@cote-azur.fr', address: 'Promenade des Anglais',
      city: 'Nice', country: 'France', lat: 43.6957, lng: 7.2649 },
    locales: ['fr', 'en', 'de'], defaultLocale: 'fr',
    features: ['lobby', 'rooms', 'smiley'],
    createdAt: new Date(), updatedAt: new Date(),
  });
  const tenants = [
    { id: royal.insertedId.toString(), slug: 'royal-lyon' },
    { id: azur.insertedId.toString(), slug: 'cote-azur' },
  ];

  // ============== USERS ==============
  const password = await bcrypt.hash('Demo2026!', 12);
  for (const t of tenants) {
    await db.collection('users').insertMany([
      { tenantId: t.id, email: `admin@${t.slug}.fr`, passwordHash: password,
        firstName: 'Admin', lastName: 'Concierge', role: 'admin', locale: 'fr',
        active: true, refreshTokens: [], createdAt: new Date(), updatedAt: new Date() },
      { tenantId: t.id, email: `staff@${t.slug}.fr`, passwordHash: password,
        firstName: 'Marie', lastName: 'Réception', role: 'staff', locale: 'fr',
        active: true, refreshTokens: [], createdAt: new Date(), updatedAt: new Date() },
    ]);
  }

  // ============== CONTENT PAGES ==============
  for (const t of tenants) {
    const isLyon = t.slug === 'royal-lyon';
    await db.collection('content_pages').insertOne({
      tenantId: t.id, slug: 'home',
      title: { fr: 'Accueil', en: 'Welcome', de: 'Willkommen', es: 'Bienvenido', jp: 'ようこそ' },
      blocks: [
        { id: 'h1', type: 'hero', order: 0, payload: {
          headline: isLyon
            ? { fr: 'Bienvenue au Royal Lyon', en: 'Welcome to The Royal Lyon', de: 'Willkommen im Royal Lyon' }
            : { fr: "Bienvenue à la Côte d'Azur", en: "Welcome to Côte d'Azur Resort" },
          subline: { fr: 'Comment vous orienter ?', en: 'How can we help?' },
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
        } },
      ],
      published: true, version: 1, createdAt: new Date(), updatedAt: new Date(),
    });
  }

  // ============== POIs — RICHER DATASET ==============
  const lyonPois = [
    // Restaurants (8)
    { name: { fr: 'Bouchon Daniel & Denise' }, category: 'restaurant', lat: 45.7592, lng: 4.836, rating: 4.6, photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=85', hours: '12h–14h · 19h–22h', phone: '04 78 60 66 53', description: { fr: 'Cuisine lyonnaise authentique, table familiale réputée.' } },
    { name: { fr: 'Le Neuvième Art' }, category: 'restaurant', lat: 45.7616, lng: 4.835, rating: 4.8, photo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=85', hours: '19h30–22h', phone: '04 72 10 11 12', description: { fr: 'Deux étoiles Michelin. Réservation indispensable.' } },
    { name: { fr: 'La Mère Brazier' }, category: 'restaurant', lat: 45.7681, lng: 4.838, rating: 4.7, photo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=85', hours: '12h–14h · 19h30–22h', phone: '04 78 23 17 20', description: { fr: 'Institution lyonnaise, deux étoiles Michelin.' } },
    { name: { fr: 'Bistrot du Potager' }, category: 'restaurant', lat: 45.762, lng: 4.834, rating: 4.5, photo: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&q=85', hours: '12h–14h · 19h–22h30', phone: '04 78 29 61 59', description: { fr: 'Cuisine de marché simple et précise.' } },
    { name: { fr: 'Le Splendid' }, category: 'restaurant', lat: 45.7575, lng: 4.833, rating: 4.4, photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=85', hours: '12h–14h30 · 19h–23h', description: { fr: 'Brasserie chic, terrasse sur Bellecour.' } },
    { name: { fr: 'Café du Soleil' }, category: 'restaurant', lat: 45.7619, lng: 4.8275, rating: 4.3, photo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=85', hours: '8h–22h', description: { fr: 'Café traditionnel du Vieux Lyon.' } },
    { name: { fr: 'Têtedoie' }, category: 'restaurant', lat: 45.7585, lng: 4.821, rating: 4.7, photo: 'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=600&q=85', hours: '12h–14h · 19h–22h30', description: { fr: 'Une étoile Michelin avec vue panoramique sur Lyon.' } },
    { name: { fr: 'Les Halles de Lyon' }, category: 'restaurant', lat: 45.7635, lng: 4.8568, rating: 4.6, photo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=85', hours: '7h–22h30', description: { fr: 'Halles Paul Bocuse, dégustation et restauration.' } },

    // Monuments (5)
    { name: { fr: 'Cathédrale Saint-Jean' }, category: 'monument', lat: 45.7613, lng: 4.8276, rating: 4.7, photo: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=85', hours: '8h–19h', description: { fr: 'Cathédrale gothique, horloge astronomique du XIVe.' } },
    { name: { fr: 'Vieux Lyon' }, category: 'monument', lat: 45.7625, lng: 4.8268, rating: 4.8, photo: 'https://images.unsplash.com/photo-1568322445389-f64ac2515099?w=600&q=85', description: { fr: 'Quartier Renaissance classé UNESCO.' } },
    { name: { fr: 'Basilique Notre-Dame de Fourvière' }, category: 'monument', lat: 45.7622, lng: 4.8226, rating: 4.8, photo: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&q=85', hours: '7h–19h', description: { fr: 'Basilique néo-byzantine, vue panoramique sur Lyon.' } },
    { name: { fr: 'Place Bellecour' }, category: 'monument', lat: 45.7579, lng: 4.832, rating: 4.6, photo: 'https://images.unsplash.com/photo-1568322445389-f64ac2515099?w=600&q=85', description: { fr: "Une des plus grandes places piétonnes d'Europe." } },
    { name: { fr: 'Place des Terreaux' }, category: 'monument', lat: 45.7676, lng: 4.834, rating: 4.5, photo: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=600&q=85', description: { fr: 'Hôtel de Ville et fontaine de Bartholdi.' } },

    // Musées (4)
    { name: { fr: 'Musée des Confluences' }, category: 'museum', lat: 45.732, lng: 4.8189, rating: 4.5, photo: 'https://images.unsplash.com/photo-1565060169187-5284465b7af2?w=600&q=85', hours: '10h30–18h30', description: { fr: 'Sciences naturelles et anthropologie, architecture spectaculaire.' } },
    { name: { fr: 'Musée des Beaux-Arts' }, category: 'museum', lat: 45.7676, lng: 4.834, rating: 4.6, photo: 'https://images.unsplash.com/photo-1565060169187-5284465b7af2?w=600&q=85', hours: '10h–18h', description: { fr: '2e collection de France — Rembrandt, Monet, Picasso.' } },
    { name: { fr: "Musée des Tissus" }, category: 'museum', lat: 45.7568, lng: 4.831, rating: 4.4, photo: 'https://images.unsplash.com/photo-1565060169187-5284465b7af2?w=600&q=85', hours: '10h–17h30', description: { fr: 'Histoire de la soie lyonnaise, artisanat exceptionnel.' } },
    { name: { fr: 'Institut Lumière' }, category: 'museum', lat: 45.7421, lng: 4.8625, rating: 4.7, photo: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=600&q=85', hours: '11h–18h30', description: { fr: 'Lieu de naissance du cinéma, maison des frères Lumière.' } },

    // Shopping (4)
    { name: { fr: 'Halles Paul Bocuse' }, category: 'shopping', lat: 45.7635, lng: 4.8568, rating: 4.6, photo: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=600&q=85', hours: '7h–22h30', description: { fr: 'Marché couvert gastronomique, 50 commerçants.' } },
    { name: { fr: 'Carré d\'Or — Rue Émile Zola' }, category: 'shopping', lat: 45.7595, lng: 4.834, rating: 4.5, photo: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=600&q=85', description: { fr: 'Boutiques de luxe : Louis Vuitton, Hermès, Cartier.' } },
    { name: { fr: 'Confluence Shopping' }, category: 'shopping', lat: 45.7411, lng: 4.8169, rating: 4.4, photo: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=85', hours: '10h–20h', description: { fr: 'Centre commercial moderne au confluent du Rhône et de la Saône.' } },
    { name: { fr: 'Marché de la Croix-Rousse' }, category: 'shopping', lat: 45.7752, lng: 4.835, rating: 4.7, photo: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=85', hours: 'Mar-Dim 6h–13h30', description: { fr: 'Marché traditionnel sur le boulevard de la Croix-Rousse.' } },

    // Parcs (3)
    { name: { fr: "Parc de la Tête d'Or" }, category: 'park', lat: 45.7783, lng: 4.852, rating: 4.8, photo: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=600&q=85', description: { fr: '105 ha — zoo, jardin botanique, lac de promenade.' } },
    { name: { fr: 'Parc des Hauteurs' }, category: 'park', lat: 45.7625, lng: 4.8226, rating: 4.5, photo: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=600&q=85', description: { fr: 'Parc panoramique à Fourvière, jardin du Rosaire.' } },
    { name: { fr: 'Parc Blandan' }, category: 'park', lat: 45.7438, lng: 4.852, rating: 4.4, photo: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=600&q=85', description: { fr: 'Ancien fort militaire transformé en parc.' } },

    // Bars (3)
    { name: { fr: 'Le Pain & le Vin' }, category: 'bar', lat: 45.76, lng: 4.834, rating: 4.5, photo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=85', hours: '17h–1h', description: { fr: 'Bar à vins, sélection de petits producteurs.' } },
    { name: { fr: 'Bar la Cave' }, category: 'bar', lat: 45.7613, lng: 4.831, rating: 4.6, photo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=85', hours: '18h–2h', description: { fr: 'Cocktails créatifs dans une cave voûtée.' } },
    { name: { fr: 'Le Sucre — Rooftop' }, category: 'bar', lat: 45.7411, lng: 4.8169, rating: 4.5, photo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=85', hours: '18h–2h', description: { fr: 'Toit-terrasse avec vue sur le Rhône, DJ sets le week-end.' } },

    // Transport (2)
    { name: { fr: 'Métro Bellecour' }, category: 'transport', lat: 45.7578, lng: 4.832, photo: 'https://images.unsplash.com/photo-1581547869738-c6cc9d35a4d7?w=600&q=85', description: { fr: 'Lignes A et D, accès direct depuis l\'hôtel.' } },
    { name: { fr: 'Gare Part-Dieu' }, category: 'transport', lat: 45.7605, lng: 4.8597, photo: 'https://images.unsplash.com/photo-1581547869738-c6cc9d35a4d7?w=600&q=85', description: { fr: 'Gare TGV principale de Lyon, Paris en 2h.' } },

    // Pharmacie
    { name: { fr: 'Pharmacie Bellecour' }, category: 'pharmacy', lat: 45.7575, lng: 4.831, photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=85', hours: '8h–22h', description: { fr: 'Pharmacie de garde, ouverte tous les jours.' } },
  ];
  await db.collection('pois').insertMany(lyonPois.map((p) => ({ ...p, tenantId: tenants[0].id, createdAt: new Date(), updatedAt: new Date() })));

  const azurPois = [
    { name: { fr: 'La Petite Maison' }, category: 'restaurant', lat: 43.6962, lng: 7.268, rating: 4.7, photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=85', hours: '12h–14h · 19h30–22h30', description: { fr: 'Cuisine niçoise familiale, références internationales.' } },
    { name: { fr: 'Le Plongeoir' }, category: 'restaurant', lat: 43.6952, lng: 7.292, rating: 4.6, photo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=85', hours: '12h–22h', description: { fr: 'Restaurant sur le port, fruits de mer et vue mer.' } },
    { name: { fr: 'Flaveur' }, category: 'restaurant', lat: 43.696, lng: 7.275, rating: 4.8, photo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=85', description: { fr: 'Deux étoiles Michelin, cuisine fusion méditerranéenne.' } },
    { name: { fr: 'Promenade des Anglais' }, category: 'monument', lat: 43.6929, lng: 7.263, rating: 4.8, photo: 'https://images.unsplash.com/photo-1568322445389-f64ac2515099?w=600&q=85', description: { fr: 'Symbole de Nice, 7 km de promenade le long de la Baie des Anges.' } },
    { name: { fr: 'Vieille Ville de Nice' }, category: 'monument', lat: 43.6951, lng: 7.2741, rating: 4.7, photo: 'https://images.unsplash.com/photo-1568322445389-f64ac2515099?w=600&q=85', description: { fr: 'Ruelles colorées, marchés provençaux.' } },
    { name: { fr: 'Colline du Château' }, category: 'monument', lat: 43.6948, lng: 7.281, rating: 4.7, photo: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&q=85', description: { fr: 'Vue panoramique sur la Baie des Anges et le port.' } },
    { name: { fr: 'Cours Saleya' }, category: 'shopping', lat: 43.6951, lng: 7.2741, rating: 4.6, photo: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=600&q=85', hours: '6h–13h30', description: { fr: 'Marché aux fleurs et aux produits locaux.' } },
    { name: { fr: 'Avenue Jean Médecin' }, category: 'shopping', lat: 43.7028, lng: 7.266, rating: 4.4, photo: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=600&q=85', description: { fr: 'Avenue commerçante principale de Nice.' } },
    { name: { fr: 'Plage Beau Rivage' }, category: 'park', lat: 43.6939, lng: 7.2645, rating: 4.6, photo: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=600&q=85', description: { fr: 'Plage de galets emblématique du centre de Nice.' } },
    { name: { fr: 'Parc du Mont Boron' }, category: 'park', lat: 43.6956, lng: 7.3035, rating: 4.7, photo: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=600&q=85', description: { fr: 'Parc forestier avec vue sur Villefranche-sur-Mer.' } },
    { name: { fr: 'MAMAC' }, category: 'museum', lat: 43.7011, lng: 7.278, rating: 4.4, photo: 'https://images.unsplash.com/photo-1565060169187-5284465b7af2?w=600&q=85', hours: '10h–18h', description: { fr: "Musée d'Art Moderne et d'Art Contemporain." } },
    { name: { fr: 'Musée Marc Chagall' }, category: 'museum', lat: 43.7077, lng: 7.272, rating: 4.7, photo: 'https://images.unsplash.com/photo-1565060169187-5284465b7af2?w=600&q=85', hours: '10h–17h30', description: { fr: 'Plus grand ensemble public d\'œuvres de Chagall.' } },
    { name: { fr: 'Musée Matisse' }, category: 'museum', lat: 43.7196, lng: 7.276, rating: 4.6, photo: 'https://images.unsplash.com/photo-1565060169187-5284465b7af2?w=600&q=85', hours: '10h–17h', description: { fr: 'Œuvres de Matisse de toutes les périodes.' } },
    { name: { fr: 'Aéroport Nice Côte d\'Azur' }, category: 'transport', lat: 43.6584, lng: 7.2159, photo: 'https://images.unsplash.com/photo-1581547869738-c6cc9d35a4d7?w=600&q=85', description: { fr: '2e aéroport de France, 7 km du centre.' } },
    { name: { fr: 'Gare de Nice-Ville' }, category: 'transport', lat: 43.7045, lng: 7.262, photo: 'https://images.unsplash.com/photo-1581547869738-c6cc9d35a4d7?w=600&q=85', description: { fr: 'TGV vers Paris, Marseille, Cannes.' } },
  ];
  await db.collection('pois').insertMany(azurPois.map((p) => ({ ...p, tenantId: tenants[1].id, createdAt: new Date(), updatedAt: new Date() })));

  // ============== MENU ITEMS — RICHER ==============
  const menuTpl = [
    // Food (12)
    { category: 'food', name: { fr: 'Salade César', en: 'Caesar salad' }, description: { fr: 'Cœur de romaine, parmesan, anchois, croûtons à l\'ail.' }, price: 14.5, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=85' },
    { category: 'food', name: { fr: 'Salade niçoise', en: 'Niçoise salad' }, description: { fr: 'Thon, œuf, olives, anchois, haricots verts.' }, price: 16.0, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=85' },
    { category: 'food', name: { fr: 'Burger Royal', en: 'Royal burger' }, description: { fr: 'Bœuf charolais, cheddar affiné, oignons confits, pain brioché.' }, price: 19.0, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=85' },
    { category: 'food', name: { fr: 'Plateau de fromages', en: 'Cheese platter' }, description: { fr: 'Sélection AOP, miel, pain aux noix, raisin frais.' }, price: 18.0, image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=85' },
    { category: 'food', name: { fr: 'Risotto aux truffes', en: 'Truffle risotto' }, description: { fr: 'Riz Carnaroli, parmesan, copeaux de truffe noire.' }, price: 32.0, image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=85' },
    { category: 'food', name: { fr: 'Tartare de bœuf', en: 'Beef tartare' }, description: { fr: 'Filet coupé au couteau, condiments classiques, frites maison.' }, price: 28.0, image: 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=85' },
    { category: 'food', name: { fr: 'Saumon Gravlax', en: 'Salmon gravlax' }, description: { fr: 'Mariné aneth-citron, pain noir, crème fraîche.' }, price: 22.0, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=85' },
    { category: 'food', name: { fr: 'Tagliatelles aux morilles', en: 'Morel tagliatelles' }, description: { fr: 'Pâtes fraîches, morilles, crème et parmesan.' }, price: 26.0, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=85' },
    { category: 'food', name: { fr: 'Quenelles à la sauce Nantua', en: 'Quenelles Nantua' }, description: { fr: 'Spécialité lyonnaise, sauce écrevisses au beurre rouge.' }, price: 24.0, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=85' },
    { category: 'food', name: { fr: 'Tartare de saumon', en: 'Salmon tartare' }, description: { fr: 'Saumon frais, avocat, citron vert, gingembre.' }, price: 21.0, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=85' },
    { category: 'food', name: { fr: 'Tarte au citron meringuée', en: 'Lemon meringue pie' }, description: { fr: 'Pâte sablée, crème de citron, meringue italienne.' }, price: 12.0, image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=85' },
    { category: 'food', name: { fr: 'Crème brûlée', en: 'Crème brûlée' }, description: { fr: 'Vanille de Madagascar, sucre caramélisé.' }, price: 11.0, image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=85' },

    // Drinks (8)
    { category: 'drink', name: { fr: 'Café espresso', en: 'Espresso' }, description: { fr: 'Sélection italienne, torréfaction artisanale.' }, price: 4.5, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=85' },
    { category: 'drink', name: { fr: 'Cappuccino', en: 'Cappuccino' }, description: { fr: 'Espresso, mousse de lait onctueuse.' }, price: 5.5, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=85' },
    { category: 'drink', name: { fr: 'Thé Mariage Frères', en: 'Mariage Frères tea' }, description: { fr: 'Sélection — Marco Polo, Earl Grey, Darjeeling.' }, price: 7.0, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=85' },
    { category: 'drink', name: { fr: 'Coupe de champagne Ruinart', en: 'Champagne Ruinart' }, description: { fr: 'Brut Blanc de Blancs, 12 cl.' }, price: 22.0, image: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=600&q=85' },
    { category: 'drink', name: { fr: 'Bouteille champagne Pol Roger', en: 'Pol Roger bottle' }, description: { fr: 'Brut Réserve, 75 cl.' }, price: 95.0, image: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=600&q=85' },
    { category: 'drink', name: { fr: 'Verre de Saint-Émilion', en: 'Saint-Émilion glass' }, description: { fr: 'Grand cru classé, 12 cl.' }, price: 14.0, image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600&q=85' },
    { category: 'drink', name: { fr: "Bouteille d'eau plate", en: 'Still water bottle' }, description: { fr: 'Évian 75 cl.' }, price: 4.0, image: 'https://images.unsplash.com/photo-1550948742-7d6816df1d31?w=600&q=85' },
    { category: 'drink', name: { fr: 'Cocktail signature', en: 'Signature cocktail' }, description: { fr: 'Création du barman — gin, fleur de sureau, cardamome.' }, price: 16.0, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=85' },

    // Spa (5)
    { category: 'spa', name: { fr: 'Massage relaxant 60 min', en: 'Relaxing massage 60 min' }, description: { fr: 'Massage Suédois traditionnel pour relâcher les tensions.' }, price: 110.0, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=85', preparationMinutes: 60 },
    { category: 'spa', name: { fr: 'Massage signature 90 min', en: 'Signature 90 min' }, description: { fr: 'Rituel exclusif, pierres chaudes et huiles essentielles.' }, price: 165.0, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=85', preparationMinutes: 90 },
    { category: 'spa', name: { fr: 'Soin du visage anti-âge 75 min', en: 'Anti-aging facial' }, description: { fr: 'Protocole haute exigence à base d\'actifs concentrés.' }, price: 145.0, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=85', preparationMinutes: 75 },
    { category: 'spa', name: { fr: 'Soin hydratant 60 min', en: 'Hydrating facial' }, description: { fr: 'Pour une peau revitalisée et lumineuse.' }, price: 95.0, image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=85', preparationMinutes: 60 },
    { category: 'spa', name: { fr: 'Hammam & gommage 45 min', en: 'Hammam & scrub' }, description: { fr: 'Rituel oriental traditionnel au savon noir.' }, price: 75.0, image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=600&q=85', preparationMinutes: 45 },

    // Taxi
    { category: 'taxi', name: { fr: 'Taxi vers gare', en: 'Taxi to station' }, description: { fr: 'Course depuis l\'hôtel.' }, price: 25.0, image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=85' },
    { category: 'taxi', name: { fr: 'Berline aéroport', en: 'Airport sedan' }, description: { fr: 'Voiture avec chauffeur, prise en charge bagages.' }, price: 65.0, image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=85' },

    // Wakeup
    { category: 'wakeup', name: { fr: 'Réveil personnalisé', en: 'Wake-up call' }, description: { fr: 'Réveil par téléphone à l\'heure souhaitée.' }, price: 0, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=85' },

    // Housekeeping
    { category: 'housekeeping', name: { fr: 'Service de chambre', en: 'Housekeeping' }, description: { fr: 'Nettoyage immédiat de la chambre.' }, price: 0, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85' },
    { category: 'housekeeping', name: { fr: 'Pressing express', en: 'Express laundry' }, description: { fr: 'Repassage et nettoyage en 1 heure.' }, price: 18.0, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85' },
  ];
  for (const t of tenants) {
    await db.collection('menu_items').insertMany(menuTpl.map((m) => ({
      ...m, tenantId: t.id, currency: 'EUR', available: true,
      preparationMinutes: m.preparationMinutes || 15,
      createdAt: new Date(), updatedAt: new Date(),
    })));
  }

  // ============== SURVEYS ==============
  for (const t of tenants) {
    await db.collection('surveys').insertOne({
      tenantId: t.id, slug: 'satisfaction-checkout',
      title: { fr: 'Votre séjour', en: 'Your stay', de: 'Ihr Aufenthalt' },
      description: { fr: 'Aidez-nous à nous améliorer en 30 secondes', en: 'Help us improve in 30 seconds' },
      questions: [
        { id: 'q1', type: 'smiley', required: true,
          label: { fr: 'Comment évaluez-vous votre séjour ?', en: 'How was your stay?' },
          options: [
            { value: 1, label: { fr: 'Très décevant', en: 'Very disappointing' }, icon: '😡' },
            { value: 2, label: { fr: 'Pas mal', en: 'Not great' }, icon: '😐' },
            { value: 3, label: { fr: 'Bien', en: 'Good' }, icon: '🙂' },
            { value: 4, label: { fr: 'Excellent', en: 'Excellent' }, icon: '😍' },
          ],
        },
        { id: 'q2', type: 'nps', required: false, label: { fr: 'Recommanderiez-vous notre hôtel ?', en: 'Would you recommend our hotel?' } },
        { id: 'q3', type: 'text', required: false, label: { fr: 'Un commentaire ?', en: 'Any comments?' }, showIf: { questionId: 'q1', operator: 'lte', value: 2 } },
      ],
      locales: ['fr', 'en', 'de'],
      publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    });
  }

  // ============== HISTORICAL RESPONSES ==============
  // Generate 200+ varied responses spread over 30 days
  const comments = [
    'Service impeccable, à recommander.',
    'Petit déjeuner excellent.',
    'Chambre un peu petite mais bien équipée.',
    'Le personnel a fait des efforts mais sans plus.',
    'Trop de bruit la nuit côté rue.',
    'Wifi instable dans la chambre.',
    'Excellent rapport qualité-prix.',
    'Spa exceptionnel, je reviendrai.',
    'Concierge très professionnel.',
    'Restaurant fermé pendant notre séjour, dommage.',
  ];
  for (const t of tenants) {
    const survey = await db.collection('surveys').findOne({ tenantId: t.id, slug: 'satisfaction-checkout' });
    if (!survey) continue;
    const samples = Array.from({ length: 220 }, (_, i) => {
      // Skewed towards positive (realistic for luxury hotel)
      const r = Math.random();
      const score = r < 0.1 ? 1 : r < 0.25 ? 2 : r < 0.55 ? 3 : 4;
      const npsBase = score === 1 ? 3 : score === 2 ? 6 : score === 3 ? 8 : 10;
      const nps = Math.max(0, Math.min(10, npsBase + (Math.random() < 0.3 ? -1 : 0)));
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const completedAt = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);
      const answers = [
        { questionId: 'q1', value: score },
        { questionId: 'q2', value: nps },
      ];
      if (score <= 2 && Math.random() < 0.7) {
        answers.push({ questionId: 'q3', value: comments[Math.floor(Math.random() * comments.length)] });
      }
      return {
        tenantId: t.id, surveyId: survey._id.toString(),
        answers,
        locale: 'fr',
        metadata: { device: 'kiosk-checkout', room: String(100 + (i % 60)) },
        completedAt,
      };
    });
    await db.collection('survey_responses').insertMany(samples);
  }

  // ============== HISTORICAL ORDERS (richer) ==============
  for (const t of tenants) {
    const menuItems = await db.collection('menu_items').find({ tenantId: t.id }).toArray();
    const foodItems = menuItems.filter((m) => m.category === 'food' || m.category === 'drink');
    if (foodItems.length === 0) continue;
    const orders = Array.from({ length: 80 }, (_, i) => {
      const r = Math.random();
      const status = r < 0.05 ? 'cancelled' : r < 0.6 ? 'delivered' : r < 0.75 ? 'preparing' : r < 0.9 ? 'accepted' : 'pending';
      const itemCount = 1 + Math.floor(Math.random() * 3);
      const items = Array.from({ length: itemCount }, () => {
        const m = foodItems[Math.floor(Math.random() * foodItems.length)];
        const qty = 1 + Math.floor(Math.random() * 2);
        return {
          menuItemId: m._id.toString(),
          name: m.name.fr || Object.values(m.name)[0],
          quantity: qty,
          unitPrice: m.price,
        };
      });
      const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minsAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000 - minsAgo * 60000);
      const statusHistory = [{ status: 'pending', at: createdAt.toISOString() }];
      if (status !== 'pending') {
        statusHistory.push({ status: 'accepted', at: new Date(createdAt.getTime() + 60000 * 2).toISOString() });
      }
      if (['preparing', 'delivered'].includes(status)) {
        statusHistory.push({ status: 'preparing', at: new Date(createdAt.getTime() + 60000 * 5).toISOString() });
      }
      if (status === 'delivered') {
        statusHistory.push({ status: 'delivered', at: new Date(createdAt.getTime() + 60000 * 18).toISOString() });
      }
      if (status === 'cancelled') {
        statusHistory.push({ status: 'cancelled', at: new Date(createdAt.getTime() + 60000 * 3).toISOString() });
      }
      return {
        tenantId: t.id,
        room: String(100 + (i % 60)),
        items,
        subtotal,
        total: subtotal,
        currency: 'EUR',
        status,
        statusHistory,
        locale: 'fr',
        source: i % 3 === 0 ? 'tablet' : i % 3 === 1 ? 'kiosk' : 'reception',
        createdAt,
        updatedAt: createdAt,
      };
    });
    await db.collection('orders').insertMany(orders);
  }

  console.log('✅ Seed terminé.');
  console.log('   2 tenants · 4 users · 31 POIs (Lyon) + 15 POIs (Côte d\'Azur)');
  console.log('   30 menu items × 2 hôtels · 2 surveys · 440 réponses · 160 commandes');
  console.log('🔑 Comptes (mdp Demo2026!) : admin@royal-lyon.fr · staff@royal-lyon.fr · admin@cote-azur.fr');
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
