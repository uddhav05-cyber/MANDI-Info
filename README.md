# Multilingual Mandi

A web platform empowering local vendors in India's traditional markets with AI-driven price discovery, instant translation across regional dialects, and modern digital tools.

## Project Structure

```
multilingual-mandi/
├── packages/
│   ├── backend/          # Node.js + Express + TypeScript backend
│   └── frontend/         # React + TypeScript frontend
├── docker-compose.yml    # PostgreSQL and Redis setup
└── package.json          # Root workspace configuration
```

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Database Services

```bash
npm run docker:up
```

This will start PostgreSQL and Redis containers.

### 3. Configure Environment Variables

Backend:
```bash
cd packages/backend
cp .env.example .env
# Edit .env with your configuration
```

Frontend:
```bash
cd packages/frontend
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Development Servers

From the root directory:

```bash
npm run dev
```

This will start both backend (port 3000) and frontend (port 5173) in development mode.

Or start them individually:

```bash
npm run dev:backend
npm run dev:frontend
```

## Available Scripts

### Root Level

- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both packages
- `npm run test` - Run tests in all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

### Backend (packages/backend)

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run lint` - Lint TypeScript files

### Frontend (packages/frontend)

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run Vitest tests
- `npm run lint` - Lint TypeScript/React files

## Technology Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL (database)
- Redis (caching)
- Jest + fast-check (testing)

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- Vitest + React Testing Library (testing)

## Database Access

PostgreSQL is available at:
- Host: localhost
- Port: 5432
- Database: multilingual_mandi
- User: mandi_user
- Password: mandi_password

Redis is available at:
- Host: localhost
- Port: 6379

## Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
cd packages/backend && npm run test -- --coverage
cd packages/frontend && npm run test -- --coverage
```

## Code Quality

Format code:
```bash
npm run format
```

Lint code:
```bash
npm run lint
```

Fix linting issues:
```bash
cd packages/backend && npm run lint:fix
cd packages/frontend && npm run lint:fix
```

## License

Private - All rights reserved
