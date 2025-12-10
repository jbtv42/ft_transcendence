# Makefile for sst project

COMPOSE := docker compose
PROJECT := sst

.PHONY: up down build re logs ps clean fclean help

default: help

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

re: down build up

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

clean: down
	# Remove dangling images (not just for this project, but usually safe)
	docker image prune -f

fclean: clean
	# Remove any anonymous volumes created by this compose file
	$(COMPOSE) down -v

help:
	@echo "Available targets:"
	@echo "  up      - Start containers in detached mode"
	@echo "  down    - Stop and remove containers"
	@echo "  build   - Build images"
	@echo "  re      - Rebuild and restart (down + build + up)"
	@echo "  logs    - Follow logs"
	@echo "  ps      - Show container status"
	@echo "  clean   - down + prune dangling images"
	@echo "  fclean  - clean + remove volumes"
