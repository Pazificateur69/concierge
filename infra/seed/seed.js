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
        { id: 'c1', type: 'cards', order: 1, payload: { columns: 3, items: [
          { icon: '🗺️', title: { fr: 'Carte locale', en: 'Local map' }, target: '/map' },
          { icon: '🛎️', title: { fr: 'Services', en: 'Services' }, target: '/services' },
          { icon: '🍽️', title: { fr: 'Restaurant', en: 'Restaurant' }, target: '/menu' },
          { icon: '🧖', title: { fr: 'Spa', en: 'Spa' }, target: '/spa' },
          { icon: '☀️', title: { fr: 'Météo', en: 'Weather' }, target: '/weather' },
          { icon: '💬', title: { fr: 'Aide', en: 'Help' }, target: '/help' },
        ] } },
      ],
      published: true, version: 1, createdAt: new Date(), updatedAt: new Date(),
    });
  }

  const lyonPois = [
    { name: { fr: 'Bouchon Daniel & Denise' }, category: 'restaurant', lat: 45.7592, lng: 4.836, rating: 4.6, photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' },
    { name: { fr: 'Cathédrale Saint-Jean' }, category: 'monument', lat: 45.7613, lng: 4.8276, rating: 4.7 },
    { name: { fr: 'Vieux Lyon' }, category: 'monument', lat: 45.7625, lng: 4.8268, rating: 4.8 },
    { name: { fr: 'Halles Paul Bocuse' }, category: 'shopping', lat: 45.7635, lng: 4.8568, rating: 4.6 },
    { name: { fr: "Parc de la Tête d'Or" }, category: 'park', lat: 45.7783, lng: 4.852, rating: 4.8 },
    { name: { fr: 'Métro Bellecour' }, category: 'transport', lat: 45.7578, lng: 4.832 },
    { name: { fr: 'Gare Part-Dieu' }, category: 'transport', lat: 45.7605, lng: 4.8597 },
    { name: { fr: 'Musée des Confluences' }, category: 'museum', lat: 45.732, lng: 4.8189, rating: 4.5 },
    { name: { fr: 'Le Pain & le Vin' }, category: 'bar', lat: 45.76, lng: 4.834, rating: 4.5 },
    { name: { fr: 'Pharmacie Bellecour' }, category: 'pharmacy', lat: 45.7575, lng: 4.831 },
  ];
  await db.collection('pois').insertMany(lyonPois.map((p) => ({ ...p, tenantId: tenants[0].id, createdAt: new Date() })));

  const azurPois = [
    { name: { fr: 'La Petite Maison' }, category: 'restaurant', lat: 43.6962, lng: 7.268, rating: 4.7 },
    { name: { fr: 'Promenade des Anglais' }, category: 'monument', lat: 43.6929, lng: 7.263, rating: 4.8 },
    { name: { fr: 'Cours Saleya' }, category: 'shopping', lat: 43.6951, lng: 7.2741, rating: 4.6 },
    { name: { fr: 'Plage Beau Rivage' }, category: 'park', lat: 43.6939, lng: 7.2645, rating: 4.6 },
    { name: { fr: 'MAMAC' }, category: 'museum', lat: 43.7011, lng: 7.278, rating: 4.4 },
    { name: { fr: 'Aéroport Nice' }, category: 'transport', lat: 43.6584, lng: 7.2159 },
  ];
  await db.collection('pois').insertMany(azurPois.map((p) => ({ ...p, tenantId: tenants[1].id, createdAt: new Date() })));

  const menuTpl = [
    { category: 'food', name: { fr: 'Salade César', en: 'Caesar salad' }, price: 14.5 },
    { category: 'food', name: { fr: 'Burger Royal', en: 'Royal burger' }, price: 19.0 },
    { category: 'food', name: { fr: 'Plateau de fromages', en: 'Cheese platter' }, price: 16.0 },
    { category: 'food', name: { fr: 'Risotto aux truffes', en: 'Truffle risotto' }, price: 26.0 },
    { category: 'drink', name: { fr: 'Café espresso', en: 'Espresso' }, price: 4.5 },
    { category: 'drink', name: { fr: 'Coupe de champagne', en: 'Glass of champagne' }, price: 18.0 },
    { category: 'drink', name: { fr: "Bouteille d'eau plate", en: 'Still water bottle' }, price: 4.0 },
    { category: 'spa', name: { fr: 'Massage 60 min', en: '60 min massage' }, price: 110.0 },
    { category: 'spa', name: { fr: 'Soin du visage', en: 'Facial care' }, price: 85.0 },
    { category: 'taxi', name: { fr: 'Taxi vers gare', en: 'Taxi to station' }, price: 25.0 },
    { category: 'wakeup', name: { fr: 'Réveil personnalisé', en: 'Wake-up call' }, price: 0 },
    { category: 'housekeeping', name: { fr: 'Service de chambre', en: 'Housekeeping' }, price: 0 },
  ];
  for (const t of tenants) {
    await db.collection('menu_items').insertMany(menuTpl.map((m) => ({
      ...m, tenantId: t.id, currency: 'EUR', available: true, preparationMinutes: 15,
      createdAt: new Date(), updatedAt: new Date(),
    })));
  }

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
        { id: 'q2', type: 'nps', required: false,
          label: { fr: 'Recommanderiez-vous notre hôtel ?', en: 'Would you recommend our hotel?' } },
        { id: 'q3', type: 'text', required: false,
          label: { fr: 'Un commentaire ?', en: 'Any comments?' },
          showIf: { questionId: 'q1', operator: 'lte', value: 2 } },
      ],
      locales: ['fr', 'en', 'de'],
      publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    });
  }

  for (const t of tenants) {
    const survey = await db.collection('surveys').findOne({ tenantId: t.id, slug: 'satisfaction-checkout' });
    if (!survey) continue;
    const samples = Array.from({ length: 50 }, (_, i) => {
      const score = [1, 2, 3, 3, 3, 4, 4, 4, 4, 4][i % 10];
      const daysAgo = Math.floor(i / 5);
      return {
        tenantId: t.id, surveyId: survey._id.toString(),
        answers: [{ questionId: 'q1', value: score }, { questionId: 'q2', value: score >= 3 ? 9 : 4 }],
        locale: 'fr', metadata: { device: 'kiosk-checkout', room: String(100 + (i % 30)) },
        completedAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000),
      };
    });
    await db.collection('survey_responses').insertMany(samples);
  }

  console.log('✅ Seed terminé.');
  console.log('🔑 Comptes (mdp Demo2026!) : admin@royal-lyon.fr · staff@royal-lyon.fr · admin@cote-azur.fr');
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
