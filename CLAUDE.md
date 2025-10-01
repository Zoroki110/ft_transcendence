# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Transcendence is a microservices-based real-time gaming platform built as a 42 School project. The architecture consists of a React frontend, NestJS backend, dedicated authentication service, and comprehensive DevOps infrastructure.

## Development Commands

### Frontend (React + TypeScript + Vite)
```bash
cd frontend_B
npm run dev          # Start development server on port 5173
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend (NestJS API)
```bash
cd backend_a
npm run start:dev    # Development with hot reload
npm run build        # Build application
npm run test         # Run unit tests
npm run test:e2e     # End-to-end tests
npm run test:cov     # Test coverage
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
```

### Authentication Service (NestJS Microservice)
```bash
cd auth_C/transcendence-auth
npm run start:dev    # Development mode
npm run build        # Build application
npm run test         # Run tests
npm run lint         # Code linting
```

### Docker Environment
```bash
cd devops_E

# Development environment
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

# Production environment
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d

# Check status
docker-compose ps
```

## Architecture

### Microservices Structure
- **frontend_B/**: React SPA with TypeScript, handles all user interface
- **backend_a/**: Main NestJS API managing users, chat, games, tournaments
- **auth_C/**: Dedicated authentication microservice with 42 School OAuth2
- **game_D/**: Game logic service (minimal implementation)
- **devops_E/**: Complete Docker infrastructure with monitoring

### Key Architectural Patterns
- **Database**: Shared PostgreSQL with TypeORM entities across services
- **Authentication**: JWT tokens with Passport strategies and OAuth2 flow
- **Real-time**: WebSocket connections for chat and game features
- **API Documentation**: Swagger UI available at `/api-docs` endpoints
- **Monitoring**: Prometheus metrics with Grafana dashboards

### Service Communication
- Frontend communicates with backend via Axios HTTP client
- Authentication handled by dedicated microservice
- Services share PostgreSQL database with different schemas
- Redis used for session management and caching

### Development Structure
- **frontend_B/src/**: Components, pages, contexts, hooks, services, types, utils
- **backend_a/src/**: Modules for auth, users, chat, game, tournaments with entities
- Both services use TypeScript with strict mode and comprehensive linting

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, React Router DOM, Axios
- **Backend**: NestJS, TypeORM, PostgreSQL, JWT, Passport, WebSocket
- **Infrastructure**: Docker, Nginx, Redis, Prometheus, Grafana
- **Testing**: Jest with coverage reporting
- **Code Quality**: ESLint, Prettier integration

## Service Endpoints

- Frontend dev server: http://localhost:5173
- Backend API: http://localhost:3000 (Swagger: /api-docs)
- Nginx proxy: http://localhost:8081
- Grafana: http://localhost:3004 (admin/1234)
- Prometheus: http://localhost:9090

## Database Schema

The application uses TypeORM entities with relations between users, tournaments, games, and chat messages. Database migrations are managed through TypeORM CLI.