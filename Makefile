# GC Communication — admin panel
# Convenience commands for local development and Docker deployment.

.DEFAULT_GOAL := help
.PHONY: help setup key dev install build up down restart rebuild logs shell artisan migrate seed fresh test

## ----- Local development (PHP + Node on your machine) -----

install: ## Install PHP + JS dependencies and prepare .env (local dev)
	composer install
	npm install
	@test -f .env || cp .env.example .env
	php artisan key:generate
	@touch database/database.sqlite
	php artisan migrate --seed

dev: ## Run the full local dev stack (Laravel + queue + Vite) with hot reload
	composer dev

build: ## Type-check and build front-end assets for production
	npm run build

test: ## Run the PHP test suite
	php artisan test

## ----- Docker deployment (your server) -----

setup: ## Create .env from the Docker template and generate APP_KEY
	@test -f .env || cp .env.docker.example .env
	@$(MAKE) key
	@echo "✓ .env ready. Edit DB_* passwords, then run: make up"

key: ## Generate a Laravel APP_KEY in .env (no PHP required)
	@if grep -q '^APP_KEY=base64:' .env 2>/dev/null; then \
		echo "APP_KEY already set."; \
	else \
		KEY=$$(openssl rand -base64 32); \
		if grep -q '^APP_KEY=' .env 2>/dev/null; then \
			sed -i.bak "s|^APP_KEY=.*|APP_KEY=base64:$$KEY|" .env && rm -f .env.bak; \
		else \
			echo "APP_KEY=base64:$$KEY" >> .env; \
		fi; \
		echo "✓ Generated APP_KEY."; \
	fi

up: ## Build and start the stack in the background
	docker compose up -d --build

down: ## Stop and remove the stack
	docker compose down

restart: ## Restart the app container
	docker compose restart app

rebuild: ## Rebuild the image from scratch and restart
	docker compose build --no-cache app
	docker compose up -d

logs: ## Tail application logs
	docker compose logs -f app

shell: ## Open a shell inside the app container
	docker compose exec app bash

artisan: ## Run an artisan command, e.g. `make artisan cmd="cache:clear"`
	docker compose exec app php artisan $(cmd)

migrate: ## Run database migrations inside the container
	docker compose exec app php artisan migrate --force

seed: ## Seed the database inside the container
	docker compose exec app php artisan db:seed --force

fresh: ## Drop, re-migrate and re-seed the database (DESTRUCTIVE)
	docker compose exec app php artisan migrate:fresh --seed --force

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
