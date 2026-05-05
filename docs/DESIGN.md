# 🎨 Design — Choix UI/UX

## Principes

### 1. Tactile-first, pas mobile-first
Les bornes ont des écrans 21–32" en orientation portrait/paysage. Les composants sont dimensionnés pour des **doigts, pas des souris** :
- Boutons min **64px** de hauteur
- Espacement entre cibles tactiles min **24px**
- Pas de hover (n'existe pas en tactile)
- Pas de tooltip (idem)
- Animations fluides (60fps) — pas de "flash" cognitif

### 2. Lisibilité immédiate
- Police de base **20px** (vs 16px standard web)
- Contraste WCAG AAA (7:1) sur tous les textes
- Hiérarchie visuelle claire (titre 48px, body 20px, légende 16px)
- Pas plus de **3 actions** par écran

### 3. Réversibilité
- Bouton **retour** toujours visible et au même endroit
- Bouton **accueil** présent (timeout auto vers home après 60s d'inactivité)
- Annulation d'action en 1 tap

### 4. Accessibilité
- **Mode vocal** (Web Speech API) : icône haut-parleur sur chaque écran
- **Multi-langues** avec drapeau visible en permanence
- **Mode contraste élevé** togglable
- **Sous-titres** pour vidéos

---

## Système de design

### Palette par défaut

```
--primary:   #1a4d8c    // Bleu nuit (élégance)
--primary-light: #2a6fb5
--accent:    #d4a85a    // Or (luxe hôtellerie)
--success:   #2d7a4b
--warning:   #e8a02d
--danger:    #c44b3f
--bg:        #fafaf7    // Crème
--bg-soft:   #f0ede5
--text:      #1a1d24
--text-soft: #555c66
```

> **Multi-tenant** : chaque hôtel surcharge `--primary`, `--accent`, logo et police. Variables CSS injectées par `tenant-service`.

### Typographies

- **Titres** : `Playfair Display` (serif élégant, hôtellerie)
- **Body** : `Inter` (sans-serif lisible)
- **UI** : `Inter`
- **Numérique** : `JetBrains Mono` (KPIs admin)

### Spacing scale (4px base)

```
xs: 4px   sm: 8px   md: 16px  lg: 24px
xl: 32px  2xl: 48px 3xl: 64px 4xl: 96px
```

### Composants partagés (`packages/ui-shared`)

- `<TouchButton>` — bouton 64px+, états visuels marqués
- `<LangSwitcher>` — drapeaux clickables
- `<VoiceToggle>` — bouton vocal (icône haut-parleur)
- `<KioskLayout>` — layout plein écran avec retour/home/timeout
- `<NumPad>` — pavé numérique tactile
- `<Card>` — carte 3D légère, ombre soft
- `<EmptyState>` — états vides illustrés

---

## Patterns d'interaction

### Mode kiosque
- Plein écran auto (`requestFullscreen`)
- Désactivation gestes système (sur Capacitor / Electron)
- **Timeout d'inactivité** 60s → retour home + reset state
- Pas de barre d'URL visible
- Pas de menu contextuel (long-press désactivé)

### Voix
```typescript
const speak = (text: string, lang = 'fr-FR') => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  speechSynthesis.speak(utterance);
};
```
Activable globalement, lit le titre et description de chaque écran à l'arrivée.

### Multi-langues
- Sélecteur drapeaux toujours visible (en haut à droite)
- Persisté dans localStorage
- 5 langues : 🇫🇷 🇬🇧 🇩🇪 🇪🇸 🇯🇵
- Détection auto si `?lang=xx` en query

### PWA offline
- Page `/offline` cachée fallback
- Toast "Mode hors-ligne" persistant
- Commandes mises en queue → sync auto au retour réseau

---

## Transitions & animations

- **Page transitions** : slide ou fade, max 300ms
- **Micro-interactions** : ripple sur tap (Material), feedback haptic (API native si dispo)
- **Loading** : skeleton, jamais de spinner long
- **Erreurs** : toast bottom, auto-dismiss 5s

---

## Wireframes des écrans clés

### Lobby — Home
```
┌─────────────────────────────────────────┐
│  [LOGO HÔTEL]      🎙️  🇫🇷 🇬🇧 🇩🇪 🇪🇸 │
│                                         │
│       Bienvenue au Royal Lyon           │
│       Comment vous orienter ?           │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │  Carte   │ │ Services │ │   Resto  ││
│  │   🗺️     │ │    🛎️    │ │    🍽️    ││
│  └──────────┘ └──────────┘ └──────────┘│
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │   Spa    │ │  Météo   │ │   Aide   ││
│  │   🧖     │ │    ☀️    │ │    💬    ││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

### Lobby — Carte
```
┌─────────────────────────────────────────┐
│  ← Retour     Carte locale     🎙️  🇫🇷  │
│                                         │
│  ┌────────────┬────────────────────────┐│
│  │            │  Filtres               ││
│  │            │  ☑ Restaurants          ││
│  │   CARTE    │  ☐ Monuments           ││
│  │  LEAFLET   │  ☐ Transport           ││
│  │            │  ☐ Shopping            ││
│  │            │                        ││
│  │            │  ─────────────         ││
│  │            │  Sélection :           ││
│  │            │  Bouchon Lyonnais      ││
│  │            │  ⭐ 4.5 · 0.4 km        ││
│  │            │  [ ITINÉRAIRE ]        ││
│  └────────────┴────────────────────────┘│
└─────────────────────────────────────────┘
```

### Smiley — Question
```
┌─────────────────────────────────────────┐
│                              🎙️ 🇫🇷 🇬🇧  │
│                                         │
│                                         │
│   Comment évaluez-vous votre séjour ?  │
│                                         │
│                                         │
│      😡        😐        🙂        😍  │
│                                         │
│    Très     Pas mal    Bien    Excellent│
│   décevant                              │
│                                         │
│                                         │
│         Question 1 / 3        [SKIP]   │
└─────────────────────────────────────────┘
```

### Réception — Kanban
```
┌──────────────────────────────────────────┐
│ Réception · Royal Lyon  🟢 12 actives    │
├────────┬──────────┬──────────┬───────────┤
│ Reçues │En cours  │ Prêtes   │ Livrées   │
│   3    │    5     │    2     │   12      │
├────────┼──────────┼──────────┼───────────┤
│ #421   │ #418     │ #415     │ #412      │
│ Ch.204 │ Ch.301   │ Ch.118   │ Ch.205    │
│ 14:32  │ 14:18    │ 14:05    │ 13:47     │
│ Café+  │ Spa rés. │ Taxi     │ Petit-d.  │
│ Cr...  │          │          │           │
└────────┴──────────┴──────────┴───────────┘
```

---

## Inspirations

- **iPad pro hôtel** d'Hilton et Marriott (élégance + utilité)
- **Bornes Selecta** dans les gares (clarté tactile)
- **Apple in-store** (cohérence multi-écran)
- **Air France iPads en bord** (multi-langues)

---

*Design pensé pour des grands comptes (SNCF, Caisse d'épargne, hôtels luxe).*
