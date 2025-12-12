
COMPOSE := docker compose

.PHONY: up down build re logs ps clean fclean help ts

default: help

ts:
	@echo "Compiling TypeScript in app/..."
	npx tsc app/index.ts   --target ES2017 --lib DOM,ES2017 --module none --outDir app
	npx tsc app/profile.ts --target ES2017 --lib DOM,ES2017 --module none --outDir app
	npx tsc app/game.ts    --target ES2017 --lib DOM,ES2017 --module none --outDir app

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

build: ts
	$(COMPOSE) build

re: down build up

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

clean: down
	docker image prune -f

fclean: clean
	$(COMPOSE) down -v

help:
	@echo "Available targets:"
	@echo "  ts      - Compile TypeScript entrypoints to JS"
	@echo "  up      - Start containers in detached mode"
	@echo "  down    - Stop and remove containers"
	@echo "  build   - Compile TS + build images"
	@echo "  re      - Rebuild and restart (down + build + up)"
	@echo "  logs    - Follow logs"
	@echo "  ps      - Show container status"
	@echo "  clean   - down + prune dangling images"
	@echo "  fclean  - clean + remove volumes"
