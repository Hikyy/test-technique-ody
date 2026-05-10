# ============================================================================
#  Makefile — Ody (Sève)
#  Monorepo pnpm + turbo + docker compose (postgres) + drizzle
# ============================================================================

SHELL        := /bin/bash
.SHELLFLAGS  := -eu -o pipefail -c
.DEFAULT_GOAL := help

# ---- Couleurs ----------------------------------------------------------------
C_RESET  := \033[0m
C_BOLD   := \033[1m
C_DIM    := \033[2m
C_GREEN  := \033[32m
C_YELLOW := \033[33m
C_BLUE   := \033[34m
C_CYAN   := \033[36m
C_RED    := \033[31m

# ---- Binaires ----------------------------------------------------------------
PNPM    := pnpm
TURBO   := $(PNPM) turbo
COMPOSE := docker compose

# ---- Apps / packages ---------------------------------------------------------
API     := @ody/api
WEB     := @ody/web
MOBILE  := @ody/mobile

.PHONY: help menu \
        install i clean reset fresh \
        dev dev-api dev-web dev-landing dev-mobile stack-up stack-down \
        build lint lint-fix format format-check typecheck test test-watch \
        check ci \
        db-up db-down db-restart db-logs db-psql db-reset \
        db-migrate db-make db-migrate-up db-migrate-down db-redo db-status \
        compose-up compose-down compose-logs compose-ps \
        env env-lan lan-ip _set-env doctor versions

# ============================================================================
#  HELP
# ============================================================================
help: ## Affiche cette aide
	@printf "$(C_BOLD)$(C_CYAN)ody — commandes disponibles$(C_RESET)\n\n"
	@printf "  Usage: $(C_GREEN)make <cible>$(C_RESET)  ou  $(C_GREEN)make menu$(C_RESET) (interactif)\n\n"
	@awk 'BEGIN {FS = ":.*?## "} \
		/^# ====/ {next} \
		/^[a-zA-Z0-9_.-]+:.*?## / { \
			printf "  $(C_GREEN)%-22s$(C_RESET) %s\n", $$1, $$2 \
		} \
		/^##@/ { printf "\n$(C_BOLD)$(C_YELLOW)%s$(C_RESET)\n", substr($$0, 5) }' $(MAKEFILE_LIST)

# ============================================================================
#  MENU INTERACTIF
# ============================================================================
menu: ## Menu interactif avec navigation flèches (Node)
	@node scripts/menu.mjs

##@ 📦 Installation

install i: ## Installe les dépendances (pnpm install)
	@printf "$(C_BLUE)→ pnpm install$(C_RESET)\n"
	@$(PNPM) install

clean: ## Supprime node_modules, .turbo, dist, build
	@printf "$(C_YELLOW)→ Nettoyage (node_modules, .turbo, dist, build, .next)$(C_RESET)\n"
	@find . -type d \( -name "node_modules" -o -name ".turbo" -o -name "dist" -o -name "build" -o -name ".next" \) \
		-not -path "*/.git/*" -prune -exec rm -rf {} + 2>/dev/null || true
	@printf "$(C_GREEN)✓ Nettoyé$(C_RESET)\n"

reset: clean install ## Clean puis réinstalle

fresh: ## Reset total : clean + db-reset + install
	@$(MAKE) clean
	@$(MAKE) db-reset
	@$(MAKE) install
	@printf "$(C_GREEN)✓ Environnement frais$(C_RESET)\n"

##@ 🚀 Développement

stack-up: ## Démarre Postgres + Mailpit (Docker) et attend que Postgres soit prêt
	@printf "$(C_BLUE)→ Docker (postgres + mailpit)$(C_RESET)\n"
	@if [ ! -f .env ]; then cp .env.example .env; printf "$(C_DIM)  .env créé depuis .env.example$(C_RESET)\n"; fi
	@$(COMPOSE) --profile mail up -d postgres mailpit
	@printf "$(C_DIM)  attente Postgres…$(C_RESET)\n"
	@set -a; . ./.env; set +a; \
	for i in $$(seq 1 60); do \
		if $(COMPOSE) exec -T postgres pg_isready -U $${PG_USER} -d $${PG_DB} >/dev/null 2>&1; then \
			printf "$(C_GREEN)✓ Stack prête$(C_RESET) $(C_DIM)(API:3001 · Web:3000 · Mailpit:8025)$(C_RESET)\n"; \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	printf "$(C_RED)✗ Postgres pas prêt après 60s$(C_RESET)\n"; exit 1

stack-down: ## Arrête Postgres + Mailpit
	@$(COMPOSE) --profile mail down

dev: stack-up ## Docker + migrations + seed (si vide) + API + Web
	@$(MAKE) -s db-migrate
	@set -a; . ./.env; set +a; \
	COUNT=$$($(COMPOSE) exec -T postgres psql -U $${PG_USER} -d $${PG_DB} -tA -c "SELECT count(*) FROM users" 2>/dev/null | tr -d '[:space:]' || echo 0); \
	if [ "$${COUNT:-0}" = "0" ]; then \
		printf "$(C_BLUE)→ Seed initial$(C_RESET)\n"; \
		$(MAKE) -s db-seed; \
	else \
		printf "$(C_DIM)• Seed sauté ($${COUNT} users) — 'make db-seed' pour forcer$(C_RESET)\n"; \
	fi
	@printf "$(C_GREEN)▶ Lancement API + Web$(C_RESET)\n"
	@$(TURBO) run dev --filter=$(API) --filter=$(WEB)

dev-api: ## Lance uniquement l'API
	@$(TURBO) run dev --filter=$(API)

dev-web: ## Lance uniquement le frontend web
	@$(TURBO) run dev --filter=$(WEB)

dev-mobile: ## Lance uniquement le mobile (J3)
	@$(TURBO) run dev --filter=$(MOBILE)

gen-types: ## Génère @ody/types depuis l'OpenAPI de l'API
	@$(PNPM) gen:types

##@ 🔨 Build & Qualité

build: ## Build l'ensemble du monorepo
	@$(PNPM) build

lint: ## Lance le linter (Biome via turbo)
	@$(PNPM) lint

lint-fix: ## Lint + auto-fix
	@$(PNPM) lint

format: ## Formate le code
	@$(PNPM) format

format-check: ## Vérifie le formatage
	@$(PNPM) format:check

typecheck: ## Vérifie les types TypeScript
	@$(PNPM) typecheck

test: ## Lance les tests
	@$(PNPM) test

test-watch: ## Tests en mode watch
	@$(TURBO) run test:watch

check: lint typecheck test ## Lint + typecheck + test (pre-commit)
	@printf "$(C_GREEN)✓ Tout est vert$(C_RESET)\n"

ci: install check build ## Pipeline CI complet

##@ 🐘 Base de données (node-pg-migrate + Postgres)

db-up: ## Démarre Postgres en arrière-plan
	@printf "$(C_BLUE)→ Démarrage Postgres$(C_RESET)\n"
	@$(COMPOSE) up -d postgres
	@printf "$(C_GREEN)✓ Postgres up$(C_RESET)\n"

db-down: ## Arrête Postgres (conserve le volume)
	@$(COMPOSE) stop postgres

db-restart: db-down db-up ## Redémarre Postgres

db-logs: ## Suit les logs Postgres
	@$(COMPOSE) logs -f postgres

db-psql: ## Ouvre un shell psql dans le container
	@$(COMPOSE) exec postgres psql -U $${PG_USER} -d $${PG_DB}

db-reset: ## Supprime le volume Postgres (⚠ destructif)
	@printf "$(C_RED)⚠ Suppression du volume Postgres$(C_RESET)\n"
	@$(COMPOSE) down -v
	@printf "$(C_GREEN)✓ Volume supprimé$(C_RESET)\n"

db-make: ## Crée une nouvelle migration TS — usage: make db-make NAME=create_invoices_table
	@if [ -z "$(NAME)" ]; then \
		printf "$(C_RED)✗ NAME requis. Exemple: make db-make NAME=create_invoices_table$(C_RESET)\n"; \
		exit 1; \
	fi
	@$(PNPM) db:make $(NAME)

db-migrate: ## Applique toutes les migrations en attente (alias: db-migrate-up)
	@$(PNPM) db:migrate

db-migrate-up: db-migrate ## Alias de db-migrate

db-migrate-down: ## Rollback de la dernière migration
	@$(PNPM) db:down

db-redo: ## Rollback puis re-applique la dernière migration
	@$(PNPM) db:redo

db-status: ## Affiche les migrations en attente (dry-run)
	@$(PNPM) db:status

db-seed: ## Peuple la base avec les données Sève
	@$(PNPM) db:seed

##@ 🐳 Docker Compose

compose-up: ## docker compose up -d
	@$(COMPOSE) up -d

compose-down: ## docker compose down
	@$(COMPOSE) down

compose-logs: ## Suit les logs (tous les services)
	@$(COMPOSE) logs -f

compose-ps: ## Liste les services
	@$(COMPOSE) ps

##@ 🛠  Utilitaires

env: ## Crée .env à partir de .env.example si absent
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		printf "$(C_GREEN)✓ .env créé depuis .env.example$(C_RESET)\n"; \
	else \
		printf "$(C_YELLOW)• .env existe déjà$(C_RESET)\n"; \
	fi

lan-ip: ## Détecte l'IP LAN et patche mobile/api/.env (override: make lan-ip IP=192.168.x.x)
	@IP="$(IP)"; \
	if [ -z "$$IP" ]; then \
		IP=$$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true); \
	fi; \
	if [ -z "$$IP" ]; then \
		printf "$(C_RED)✗ Aucune IP LAN détectée. Force avec: make lan-ip IP=192.168.x.x$(C_RESET)\n"; exit 1; \
	fi; \
	printf "$(C_BLUE)→ IP LAN: $(C_BOLD)%s$(C_RESET)\n" "$$IP"; \
	API_URL="http://$$IP:3001"; \
	CORS="http://localhost:3000,http://$$IP:3000,http://$$IP:3001,http://$$IP:8081"; \
	for f in apps/mobile/.env apps/api/.env .env; do \
		dir=$$(dirname "$$f"); \
		if [ ! -f "$$f" ] && [ -f "$$dir/.env.example" ]; then cp "$$dir/.env.example" "$$f"; fi; \
		[ -f "$$f" ] || touch "$$f"; \
	done; \
	$(MAKE) -s _set-env FILE=apps/mobile/.env KEY=EXPO_PUBLIC_API_URL VALUE="$$API_URL"; \
	$(MAKE) -s _set-env FILE=apps/api/.env    KEY=CORS_ORIGINS         VALUE="$$CORS"; \
	$(MAKE) -s _set-env FILE=.env             KEY=CORS_ORIGINS         VALUE="$$CORS"; \
	printf "$(C_GREEN)✓ .env mis à jour pour LAN ($$IP)$(C_RESET)\n"; \
	printf "$(C_DIM)  → relance Expo avec cache vidé: pnpm --filter @ody/mobile start -c$(C_RESET)\n"

env-lan: lan-ip ## Alias de lan-ip

# Helper : upsert KEY=VALUE dans FILE (idempotent, indépendant de sed BSD/GNU)
_set-env:
	@tmp=$$(mktemp); \
	if grep -q "^$(KEY)=" "$(FILE)" 2>/dev/null; then \
		awk -v k="$(KEY)" -v v="$(VALUE)" 'BEGIN{FS=OFS="="} $$1==k{print k"="v; next} {print}' "$(FILE)" > "$$tmp" && mv "$$tmp" "$(FILE)"; \
	else \
		cp "$(FILE)" "$$tmp" && printf "%s=%s\n" "$(KEY)" "$(VALUE)" >> "$$tmp" && mv "$$tmp" "$(FILE)"; \
	fi

versions: ## Affiche les versions installées
	@printf "$(C_BOLD)Versions:$(C_RESET)\n"
	@printf "  node    : "; node -v 2>/dev/null || echo "absent"
	@printf "  pnpm    : "; pnpm -v 2>/dev/null || echo "absent"
	@printf "  docker  : "; docker --version 2>/dev/null || echo "absent"
	@printf "  turbo   : "; $(PNPM) turbo --version 2>/dev/null || echo "absent"

doctor: ## Vérifie l'environnement (node, pnpm, docker, .env)
	@printf "$(C_BOLD)Doctor ody$(C_RESET)\n"
	@ok=true; \
	for bin in node pnpm docker; do \
		if command -v $$bin >/dev/null 2>&1; then \
			printf "  $(C_GREEN)✓$(C_RESET) %-8s %s\n" "$$bin" "$$($$bin --version 2>/dev/null | head -1)"; \
		else \
			printf "  $(C_RED)✗$(C_RESET) %-8s manquant\n" "$$bin"; ok=false; \
		fi; \
	done; \
	if [ -f .env ]; then \
		printf "  $(C_GREEN)✓$(C_RESET) .env       présent\n"; \
	else \
		printf "  $(C_YELLOW)•$(C_RESET) .env       absent (lance: make env)\n"; \
	fi; \
	$$ok || exit 1
