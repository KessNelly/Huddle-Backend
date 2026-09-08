# Huddle

Backend API for **Huddle** — a lightweight collaboration platform for small remote teams.

This repository contains the Node.js + TypeScript implementation of the MVP focused on the core sprint goal:

> A user can create an account, sign in, enter a channel, send a message, and another user can see that message.

---

## Tech Stack

| Layer            | Choice                          |
|------------------|---------------------------------|
| Runtime          | Node.js (LTS, ≥ 18)             |
| Language         | TypeScript (strict)             |
| Framework        | Express.js                      |
| Database         | PostgreSQL                      |
| ORM              | Prisma                          |
| Auth             | bcrypt + JSON Web Tokens (JWT)  |
| Validation       | Zod                             |
| Testing          | Jest + Supertest                |
| Dev runner       | tsx                             |

---

## Project Structure

```
huddle-backend/
├── prisma/                 # Prisma schema & migrations
├── src/
│   ├── controllers/        # Request handlers
│   ├── lib/                # Shared utilities (prisma client, jwt, etc.)
│   ├── middleware/         # Auth middleware, error handler, etc.
│   ├── routes/             # Express routers
│   ├── types/              # Shared TypeScript types
│   ├── validators/         # Zod schemas
│   └── index.ts            # App entry point
├── tests/                  # Integration & unit tests
├── .env.example            # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally (or via Docker)
- Git

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd huddle-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `DATABASE_URL` — your local PostgreSQL connection string  
- `JWT_SECRET` — a long random string  

### 4. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
```
---

## API Endpoints (P0)

Full contract is documented in the separate **API Endpoint Contract** document. Summary:

| Method | Endpoint                              | Auth required | Purpose                    |
|--------|---------------------------------------|---------------|----------------------------|
| POST   | `/api/auth/register`                  | No            | Create a new account       |
| POST   | `/api/auth/login`                     | No            | Sign in and receive JWT    |
| GET    | `/api/channels`                       | Yes           | List available channels    |
| GET    | `/api/channels/:channelId/messages`   | Yes           | Get message history        |
| POST   | `/api/channels/:channelId/messages`   | Yes           | Send a message             |

Protected routes require the header:

```
Authorization: Bearer <access_token>
```

---

## Testing

```bash
npm test
```

