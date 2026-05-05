# 🤝 Contributing — Conventions de code

## Workflow Git

```
main             ← branche stable, déployée
└── feat/xxx     ← features
└── fix/xxx      ← bugs
└── docs/xxx     ← documentation
└── chore/xxx    ← maintenance
```

## Commit messages (Conventional Commits)

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

**Types** : `feat` · `fix` · `docs` · `chore` · `refactor` · `test` · `style` · `perf`

**Exemples** :
```
feat(orders): add WebSocket emission on status change
fix(auth): handle expired refresh tokens correctly
docs(api): update Swagger annotations for surveys
chore(deps): bump nestjs to 10.4
```

## Code style

- **Formatter** : Prettier (config racine)
- **Linter** : ESLint
- **Pre-commit** : `husky` + `lint-staged` (lance prettier + eslint sur les fichiers staged)

```bash
# Avant de commit, lance toujours :
pnpm lint
pnpm test
```

## Conventions TypeScript

- **Imports** : ordre = node → tiers → internes (`@concierge/*`) → relatifs
- **Types** : préférer `interface` pour les objets, `type` pour les unions
- **Nullité** : `strictNullChecks` activé, pas de `!` non-null assertion sans commentaire
- **Async** : toujours `async/await`, pas de `.then()`
- **Erreurs** : exceptions NestJS (`HttpException`, `BadRequestException`) côté API

## Conventions NestJS

- **Structure** par module : `controller`, `service`, `repository`, `dto`, `entities`
- **DTOs** : class-validator + class-transformer
- **Repos** : pas de Mongoose dans les services, passer par un repo
- **Tests** : 1 fichier `.spec.ts` par service, mocking des repos

## Conventions Vue/Ionic

- **Composition API** uniquement (pas d'Options API)
- **`<script setup lang="ts">`**
- **Pinia** pour le state global
- **vue-i18n** pour les traductions
- **Naming** : `PascalCase` pour les composants

## Conventions Angular

- **Standalone components** (pas de NgModules)
- **Signals** pour le state local (Angular 17+)
- **`provideRouter` + lazy routes**
- **Reactive forms** uniquement
- **Naming** : `kebab-case` pour les fichiers, `PascalCase` pour les classes

## Tests

- **Unit** : Jest (back) · Vitest (Vue) · Karma (Angular par défaut)
- **E2E** : Cypress sur le lobby
- **Coverage minimum** : 60% sur les services backend critiques (auth, orders)

## Reviews

Tout changement passe par PR avec :
- Description claire (pourquoi, comment)
- Screenshots si UI
- Tests qui passent
- Coverage non régressée

---

*Doc volontairement courte — Concierge est un projet solo de candidature.*
