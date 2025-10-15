# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ft_transcendence** is a full-stack real-time multiplayer Pong game platform with tournaments, challenges, chat, and social features. The project is structured as a microservices architecture using Docker.

## Repository Structure

The repository is organized into distinct modules:

- **backend_a/** - NestJS backend (TypeScript)
- **frontend_B/** - React + Vite frontend (TypeScript)
- **auth_C/** - Authentication service (placeholder/legacy)
- **game_D/** - Game logic service (placeholder/legacy)
- **devops_E/** - All DevOps configuration (Docker, monitoring, deployment)

**Note**: The primary backend and frontend are `backend_a` and `frontend_B`. The auth and game modules appear to be placeholders or legacy code.

## Development Commands

### Starting the Application

All commands should be run from the `devops_E/` directory:

```bash
cd devops_E
make up-full          # Start all services (DB, Redis, Backend, Frontend, Monitoring)
make up-infra         # Start only infrastructure (DB, Redis, Prometheus, Grafana)
make status           # Check service status
make logs             # View all logs
```

### Working with Individual Services

```bash
# Backend
make backend                # Start backend only
make restart-backend        # Restart backend (no rebuild)
make rebuild-backend        # Rebuild and restart backend
make logs-backend           # View backend logs
make exec-backend           # Open shell in backend container

# Frontend
make frontend               # Start frontend only
make restart-frontend       # Restart frontend (no rebuild)
make rebuild-frontend       # Rebuild and restart frontend
make logs-frontend          # View frontend logs
make exec-frontend          # Open shell in frontend container

# Database
make db-shell               # Open PostgreSQL shell
make db-migrate             # Apply migrations
```

### Testing and Linting

```bash
# Backend (from backend_a/)
npm run test              # Run unit tests
npm run test:e2e          # Run e2e tests
npm run test:cov          # Run tests with coverage
npm run lint              # Run ESLint

# Frontend (from frontend_B/)
npm run build             # Build for production
npm run dev               # Run dev server locally (outside Docker)
```

### Stopping Services

```bash
cd devops_E
make down                 # Stop all services
make clean                # Clean Docker resources
```

## Architecture

### Backend Architecture (NestJS)

The backend follows NestJS modular architecture:

- **src/auth/** - Authentication (JWT, OAuth 42, 2FA)
  - `jwt/` - JWT strategy and guards
  - `oauth/` - OAuth 42 integration
  - `twofa/` - Two-factor authentication
- **src/users/** - User management and profiles
- **src/game/** - Pong game logic and WebSocket handling
- **src/tournaments/** - Tournament creation and management
- **src/challenges/** - 1v1 challenge system
- **src/chat/** - Real-time chat with WebSockets
- **src/entities/** - TypeORM entities (User, Match, Tournament, etc.)
- **src/common/** - Shared guards, decorators, and utilities
- **src/health/** - Health check endpoint

**Key Technologies**:
- TypeORM with PostgreSQL
- WebSockets (Socket.io) for real-time features
- Passport.js for authentication
- Swagger for API documentation (available at `/api-docs` in development)

**Database Connection**: Configured via environment variables (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)

### Frontend Architecture (React + Vite)

The frontend uses React with TypeScript and follows a component-based architecture:

- **src/pages/** - Page components (Home, Login, Game, Tournaments, Profile, etc.)
- **src/components/** - Reusable components (Navigation, ErrorBoundary, etc.)
- **src/contexts/** - React Context providers:
  - `UserContext` - User authentication and state (11KB, complex)
  - `TournamentContext` - Tournament state management
  - `NotificationContext` - Global notifications
- **src/services/** - API and WebSocket clients:
  - `api.ts` - Axios-based API client
  - `socket.ts` - Socket.io client for real-time features
- **src/hooks/** - Custom React hooks
- **src/types/** - TypeScript type definitions
- **src/utils/** - Utility functions

**Key Technologies**:
- React Router for navigation
- Socket.io-client for real-time communication
- Axios for HTTP requests
- Vite for build tooling

**Configuration**: API URL configured via `VITE_API_URL` environment variable (defaults to `http://localhost:3000`)

### Real-Time Features

The application heavily uses WebSockets for:
- Game state synchronization
- Chat messaging
- Tournament updates
- Challenge notifications
- User online status

WebSocket connections are managed in `frontend_B/src/services/socket.ts` and `backend_a/src/game/game.gateway.ts` (and similar gateways for chat, tournaments).

### DevOps Architecture

Orchestrated via Docker Compose from `devops_E/docker/`:

- **database** - PostgreSQL 15 (port 5432)
- **redis** - Redis 7 for caching/sessions (port 6380)
- **backend_a** - NestJS API (port 3000)
- **frontend_b** - Vite dev server (port 5173)
- **nginx** - Reverse proxy (ports 8081, 8443)
- **prometheus** - Metrics collection (port 9090)
- **grafana** - Monitoring dashboards (port 3004, credentials: admin/1234)
- **cadvisor** - Container metrics (port 8080)

## Key Implementation Patterns

### Authentication Flow

1. User logs in via OAuth 42 (`/auth/42`) or local credentials
2. Backend returns JWT token
3. Frontend stores token in UserContext
4. Protected routes use `ProtectedRoute` component
5. API requests include token via Axios interceptor

### Game Flow

1. User enters matchmaking queue
2. Backend matches players via WebSocket
3. Game state synchronized in real-time
4. Match results stored in database

### Tournament Flow

1. Tournament created by organizer
2. Players register for tournament
3. Brackets generated automatically
4. Matches played with real-time updates
5. Winner advancement handled by backend

## Environment Variables

### Backend (backend_a/.env)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` - Database config
- `JWT_SECRET` - JWT signing secret
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins
- `PORT` - Backend port (default 3000)

### Frontend (frontend_B/.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000)

### DevOps (devops_E/environments/)
- `.env.dev` - Development environment
- `.env.staging` - Staging environment
- `.env.prod` - Production environment

## Common Issues

### Backend won't start
- Check database is running: `docker ps | grep database`
- Check database connection in logs: `make logs-backend`
- Verify environment variables in `backend_a/.env`

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check CORS configuration in `backend_a/src/main.ts`
- Ensure backend is running: `curl http://localhost:3000/health`

### WebSocket connection fails
- Check that backend WebSocket gateway is running
- Verify frontend socket URL in `src/services/socket.ts`
- Check browser console for connection errors

### Database migrations needed
- Run migrations: `make db-migrate` from `devops_E/`
- Or manually: `make db-shell` and run SQL

## Service URLs (Development)

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Grafana**: http://localhost:3004 (admin/1234)
- **Prometheus**: http://localhost:9090
- **Database**: localhost:5432

## Module-Specific Notes

### Backend Testing
- Test files use `.spec.ts` suffix
- E2E tests in `test/` directory with `jest-e2e.json` config
- Run specific test: `npm run test -- <filename>`

### Frontend Development
- Hot module replacement (HMR) enabled in dev mode
- React Router handles all routing in `App.tsx`
- Global state managed via Context API (not Redux)
- Error boundaries catch component errors

### Docker Development
- Backend uses volume mount for hot reload in dev
- Frontend runs `npm run dev` inside container
- Database data persisted in Docker volumes
- Use `make rebuild-*` when dependencies change
