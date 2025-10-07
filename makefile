# Makefile
# Makefile for building three simulated nodes

# List of environments to build
ENVS = phunode1 labnode1 labnode2

# Default environment
ENV ?= phunode1
ENV_FILE = envs/env.dev.$(ENV)
COMPOSE_FILE = docker-compose.yml
NETWORK_NAME = demo-net

# Database credentials (for demo data seeding)
MYSQL_PASS = dbPassword123

# Colors for nicer logs
GREEN=\033[0;32m
YELLOW := \033[33m
RED := \033[0;31m
RESET=\033[0m

# Path variables
ENV_FILES=./envs/
SCRIPTS=./automation/scripts/
DEMO_SQL=./automation/demo_data/

# List all commands to execute
.PHONY: help build up down logs restart

# Help command to list all available commands
help:
	@echo "Usage: make [target] ENV=<env_name>"
	@echo ""
	@echo "Targets:"
	@echo "  build       Build images for one env (default: phunode1)"
	@echo "  build-all   Build images for ALL envs in sequence"
	@echo "  up          Start containers for one env"
	@echo "  down        Stop containers for one env"
	@echo "  logs        Tail logs for one env"
	@echo "  restart     Restart containers for one env"


build:
	@echo "$(GREEN)[*] Building with $(ENV)$(RESET)"
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) build

up:
	@echo "$(GREEN)[*] Starting with $(ENV)$(RESET)"
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up -d

down:
	@echo "$(GREEN)[*] Stopping with $(ENV)$(RESET)"
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down

logs:
	@echo "$(GREEN)[*] Logs for $(ENV)$(RESET)"
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) logs -f

restart: down up

# Build all environments (no demo data)
build-all:
	@if [ -z "$$(docker network ls -q -f name=$(NETWORK_NAME))" ]; then \
		echo "Creating network $(NETWORK_NAME)..."; \
		docker network create $(NETWORK_NAME); \
	else \
		echo "Network $(NETWORK_NAME) already exists."; \
	fi \
	@for e in $(ENVS); do \
		echo "$(GREEN)[*] Building with $$e$(RESET)"; \
		docker compose --profile $${e:0:3} --env-file $(ENV_FILES).env.dev.$$e -p $$e up --build -d; \
	done

# Build all environments and load demo data (db records and fasta files)
build-all-demo:
	@if [ -z "$$(docker network ls -q -f name=$(NETWORK_NAME))" ]; then \
		echo "Creating network $(NETWORK_NAME)..."; \
		docker network create $(NETWORK_NAME); \
	else \
		echo "Network $(NETWORK_NAME) already exists."; \
	fi
	@for e in $(ENVS); do \
		echo "$(GREEN)[*] Building with $$e$(RESET)"; \
		echo "The current directory is: $$(pwd)"; \
		docker compose --profile $${e:0:3} --env-file ./envs/.env.dev.$$e -p $$e up --build -d; \
		\
		echo "$(YELLOW)[*] Waiting for MySQL initialization in $$e$(RESET)"; \
		until docker exec $$(docker ps -aqf "name=$$e.sql-1") \
			mysql -uroot --password=$(MYSQL_PASS) -e "SELECT 1;" 2>/dev/null; do \
			sleep 2; \
		done; \
		\
		echo "$(YELLOW)[*] Waiting for MySQL schema build in $$e$(RESET)"; \
		sleep 20; \
		echo "$(GREEN)[*] Seeding DB for $$e$(RESET)"; \
		echo "$(GREEN)[*] Seeding with: $(DEMO_SQL)$$e.sql $(RESET)"; \
		\
		until docker exec -i $$(docker ps -aqf "name=$$e.sql-1") \
			mysql -uroot --password=$(MYSQL_PASS) h2seq < "$(DEMO_SQL)$$e.sql"; do \
			sleep 20; \
		done; \
		\
		echo "$(GREEN)[*] Transferring FASTA for $$e$(RESET)"; \
		bash $(SCRIPTS)transfer_demo_fasta.sh $$e; \
		\
	done; \
	echo "$(GREEN)[*] Building central Caddy proxy$(RESET)"; \
	cd caddy-proxy && docker compose up --build -d; \

	docker network connect phunode1_backend caddy; \
	docker network connect labnode1_backend caddy; \
	docker network connect labnode2_backend caddy; \

