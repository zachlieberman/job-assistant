.PHONY: up down backend frontend dev db-reset test

up:
	docker compose up -d
	@echo "Waiting for database to be ready..."
	@until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done

backend: up
	cd backend && uvicorn app.main:app --reload

frontend:
	cd frontend && npm run dev

dev: up
	cd backend && uvicorn app.main:app --reload &
	cd frontend && npm run dev

down:
	docker compose down
	pkill -f "uvicorn app.main" 2>/dev/null || true
	pkill -f "vite" 2>/dev/null || true

test:
	cd frontend && npm test -- --run

db-reset:
	docker compose down -v
	docker compose up -d
	@echo "Waiting for database to be ready..."
	@until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@echo "Database reset complete. Restart the backend to recreate tables."
