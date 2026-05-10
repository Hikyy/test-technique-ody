# Sève — Ops SaaS Restaurant

Monorepo (pnpm + turbo) qui héberge un SaaS de gestion d'un restaurant indépendant ou d'un groupe : commandes, réservations, plan de salle, fiches clients, équipe, multi-restaurants.

> **Stack** : Hono + Better Auth + Drizzle + Postgres 18 (API) · Next.js 16 + Tailwind v4 + TanStack Query 5 (web) · Expo SDK 54 + Reanimated + react-hook-form (mobile) · DDD , JSON:API côté HTTP.

---

## ⚡ Démarrage

```bash
pnpm install
make dev          # ou : make menu  → choisir "dev"
```

`make dev` orchestre :
1. Docker Compose : Postgres + Mailpit
2. Attente Postgres healthy
3. Migrations Drizzle
4. Seed initial si la base est vide (sinon skip)
5. API + Web en parallèle (Turbo)

URLs locales :

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Mailpit (catcher SMTP dev) | http://localhost:8025 |

Cibles utiles :

```bash
make menu         # menu interactif (flèches)
make dev          # tout démarrer (Docker + migrations + seed + front + back)
make stack-up     # Docker uniquement (Postgres + Mailpit)
make stack-down   # Stop tous les conteneurs
make dev-api      # API seule
make dev-web      # Web seul
make db-seed      # Force un re-seed
make db-reset     # Wipe complet du volume Postgres
make help         # Liste toutes les cibles
```

### Comptes seedés

Mot de passe : `seve1234`.

| Email | Rôle |
|---|---|
| `chef@seve.fr` | owner Sève Group + admin Bistrot Lumière (5 restaurants) |
| `marie@bistrot.fr` | owner Bistrot Lumière + admin Sève Group |
| `jean@cafesoleil.fr` | owner Café Soleil |
| `thomas@seve.fr` | admin Sève Group + manager 3 restos |
| `sophie@seve.fr` | member Sève Group + staff 3 restos |

---

## ✨ Fonctionnalités

### Multi-organisations & multi-restaurants

- **Une organisation = un compte propriétaire**. Un user ne peut posséder qu'**une seule** organisation (verrou backend + UI).
- Une organisation regroupe **plusieurs restaurants** (Sève Paris, Sève Lyon, …).
- Un user peut être invité comme `admin` ou `member` dans des organisations tierces — switcher dans la sidebar / settings mobile.
- Switcher org + restaurant via cookies (`seve_active_org`, `seve_active_restaurant`) injectés en `x-organization-id` / `x-restaurant-id` à chaque appel API.

### Modèle de données

| Niveau | Entités |
|---|---|
| **Organisation** | `customers` (KPIs aggrégés cross-restaurants) |
| **Restaurant** | `categories`, `dishes`, `restaurant_tables`, `reservations`, `orders`, `notifications`, horaires d'ouverture |

### Réservations

- Plan de salle avec capacités par table.
- 2 vues : **Carte** (timeline tables × heures, codes couleur par statut) et **Liste**.
- Détection automatique de conflits via Postgres `EXCLUDE USING gist` + `tstzrange` (impossible de double-booker un slot actif).
- Statuts : `pending` → `confirmed` → `seated` → `completed` (+ `cancelled`, `no_show`).
- Lien réservation ↔ commande : à l'arrivée du client, on prend la commande en référençant la résa.

### Commandes

- Création avec picker de table, lien réservation, picker client (+ création inline).
- Filtre par catégorie pour ajouter rapidement des plats.
- Status flow `pending` → `cooking` → `sent` → `served`.
- Stream SSE `/api/dashboard/stream` pour update temps réel sur la home.

### Clients

- Fiches partagées au niveau organisation (visites + dépense agrégées sur tous les restaurants de l'org).
- Création inline depuis le form commande ou réservation.

### Équipe

- Invitations par email avec rôle `admin` / `manager` / `staff`.
- Mailpit catche tous les mails en dev.
- Acceptation via lien signé (token sha256, expiration 7 jours).

### Onboarding

- Wizard en 5 étapes : Identité → Horaires → Plan de salle → Carte → Clients.
- Pré-remplissage de jeux de données fictifs disponible à chaque étape.

### Sécurité

- Better Auth (email + password, scrypt natif) + sessions cookies.
- Middleware tenant en 3 couches : `requireAuth` (avec validation users.id en DB pour invalider le cookie cache après truncate) → `requireOrganization` → `requireRestaurant` (filtre cross-org).
- Defense-in-depth : tous les endpoints valident que les ressources cible (`table_id`, `reservation_id`, `customer_id`) appartiennent au restaurant actif.

### i18n

- next-intl (web) + custom hook (mobile), source unique dans `packages/i18n`.
- FR par défaut, EN supporté.

---

## 🧱 Architecture

```
apps/
  api/        Hono + better-auth + Drizzle (port 3001)
  web/        Next.js 16 App Router (port 3000)
  mobile/     Expo SDK 54
packages/
  domain/     DDD bounded contexts (customer, catalog, ordering, restaurant, organization, notification)
  sdk/        TanStack Query hooks + Zod schemas + ApiClient
  ui/         Atoms / Molecules / Organisms partagés (Tailwind v4)
  i18n/       Messages FR / EN
  types/      Types JSON:API génériques
db/
  migrations/ node-pg-migrate (20 migrations)
  src/        Drizzle schema + seed-data
  scripts/    runner CLI
```

### Bounded contexts (DDD)
- **identity** — auth, sessions
- **organization** — orgs + memberships + cross-org switcher
- **restaurant** — settings (horaires, notifications), tables, invitations équipe
- **customer** — fiches clients (org-scope)
- **catalog** — categories, dishes (restaurant-scope)
- **ordering** — orders + lines (restaurant-scope)
- **notification** — bell + bus interne via SSE

---

## 🛠 Cibles Make complètes

```bash
make help                # Liste toutes les cibles avec leur description

# Lifecycle
make dev                 # Docker + migrations + seed + front + back
make stack-up            # Postgres + Mailpit uniquement
make stack-down          # Stop tous les conteneurs

# Dev individuel
make dev-api             # API uniquement (port 3001)
make dev-web             # Web uniquement (port 3000)
make dev-mobile          # Expo (Metro)

# Base
make db-migrate          # Applique les migrations
make db-seed             # Truncate + insert riche
make db-status           # Liste les migrations restantes
make db-make NAME=foo    # Génère un fichier de migration TS
make db-psql             # Shell psql dans le container
make db-reset            # ⚠ Drop le volume Postgres

# Qualité
make typecheck           # tsc --noEmit sur tous les packages
make lint                # biome + eslint
make test                # vitest (51 tests API)
make build               # build production
make check               # lint + typecheck + test
make ci                  # Pipeline CI complet
```

---

## 🔐 Variables d'environnement

Chaque app a son `.env.example` à copier en `.env`.

| Fichier | Sert à |
|---|---|
| `./.env` | Variables PG_* utilisées par Docker Compose et `make dev` |
| `./apps/api/.env` | API (auth, mail, storage, CORS) — voir `apps/api/src/config.ts` (Zod) |
| `./apps/web/.env.local` | `NEXT_PUBLIC_API_URL` |
| `./apps/mobile/.env` | `EXPO_PUBLIC_API_URL` (utiliser l'IP LAN sur device physique) |
| `./db/.env` | PG_* pour `node-pg-migrate` et le seeder |

`make dev` initialise automatiquement `./.env` depuis `.env.example` au premier lancement. Les autres `.env` doivent être créés manuellement (sécurité : `AUTH_SECRET` notamment).

```bash
openssl rand -base64 32         # génère un AUTH_SECRET
```

---

## 📚 Ressources

- API OpenAPI : http://localhost:3001/reference (Scalar)
- Mailpit UI : http://localhost:8025
- Tests : `make test` (51 passent)

---
