# **************************************************************************** #
#                                   ft_t                                       #
# **************************************************************************** #

NAME        := ft_transcendence
DC          := docker compose
APP_DIR     := app

all: up

ts:
	@echo "==> Building TypeScript (npm run build in $(APP_DIR))"
	@cd $(APP_DIR) && npm run build

up: ts
	@echo "==> Starting docker-compose (build + up)"
	@$(DC) up --build

up-d: ts
	@echo "==> Starting docker-compose in detached mode (build + up -d)"
	@$(DC) up --build -d

down:
	@echo "==> Stopping containers"
	@$(DC) down

logs:
	@echo "==> Following logs"
	@$(DC) logs -f

clean: down
	@echo "==> Cleaning TS build artifacts"
	@rm -rf $(APP_DIR)/dist

fclean: clean
	@echo "==> Removing docker images"
	@$(DC) down --rmi local --volumes --remove-orphans

re: fclean all

.PHONY: all ts up up-d down logs clean fclean re
