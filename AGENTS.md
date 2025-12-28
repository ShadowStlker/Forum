# AGENTS.md

## 1. Build / Lint / Test Commands

| Action | Command | Notes |
|--------|---------|-------|
| **Install dependencies** | `npm ci` | Installs exact versions from `package-lock.json`.
| **Build the project** | `npm run build` | Runs the TypeScript compiler (or build script).
| **Lint source code** | `npm run lint` | Uses ESLint with Prettier.
| **Run all tests** | `npm test` | Executes Jest in watch‑mode off.
| **Run a single test file** | `npm test -- <path/to/file.test.ts>` | Example: `npm test -- tests/auth.test.ts`.
| **Run a single test case** | `npm test -- <path/to/file.test.ts> -t <testName>` | Jest’s `-t` pattern matcher.
| **Run tests in CI** | `npm test -- --runInBand` | Serial execution for deterministic results.
| **Check type safety** | `npm run typecheck` | Runs `tsc --noEmit`.
| **Format code** | `npm run format` | Runs Prettier.
| **Check for lint + format** | `npm run check` | Runs both ESLint and Prettier.



## 2. Code Style Guidelines

These guidelines are meant to keep the codebase consistent and readable. Follow them when adding or refactoring code.

### 2.1. Project Structure

```
backend/
  src/
    config/
    db/
    middleware/
    routes/
    controllers/
    utils/
    app.ts
    server.ts
  tests/
  package.json
  tsconfig.json
  jest.config.js
  .env.example
frontend/
  src/
    components/
    pages/
    lib/
    styles/
    App.tsx
  tailwind.config.js
  postcss.config.js
  package.json
  tsconfig.json
  .env.example
```

- Keep source code inside `src/`. Tests live in `tests/` at the same level as `src/`.
- Use **feature‑centric** folders in `src/` (e.g., `users/`, `posts/`).

### 2.2. Imports

- Prefer **relative imports** that start with `./` or `../`.
- Do **not** use absolute imports unless configured with a `tsconfig` path alias.
- Keep import order:
  1. Standard library (`fs`, `path`, ...)
  2. Third‑party modules (`express`, `prisma`, ...)
  3. Local modules (relative paths)
- End the list with a blank line.

```ts
import fs from 'fs';
import path from 'path';

import express from 'express';
import { PrismaClient } from '@prisma/client';

import { authMiddleware } from './middleware/auth';
```

### 2.3. Formatting

- Use **Prettier** (config in `.prettierrc`).
- 2‑space indentation (consistent with Prettier defaults).
- No trailing semicolons.
- Lines should not exceed 120 characters.
- File endings must be LF (`
`).

### 2.4. Types & TypeScript

- All public APIs should have explicit types. Never use `any` or `unknown`.
- Prefer **readonly** for objects that are never mutated.
- When returning from a function, always annotate the return type.
- Use `enum` for fixed string sets (e.g., `enum UserRole { Admin, User }`).
- For API request/response payloads, create dedicated types in a `types/` folder.
- Do **not** expose internal implementation types in public interfaces.

### 2.5. Naming Conventions

| Entity | Prefix | Example |
|--------|--------|---------|
| **Constants** | `UPPER_SNAKE_CASE` | `const MAX_RETRY = 3;` |
| **Enums** | `PascalCase` | `enum UserRole { Admin, User }` |
| **Interfaces / Types** | `PascalCase` | `interface UserDTO { ... }` |
| **Classes** | `PascalCase` | `class AuthController { ... }` |
| **Functions / Methods** | `camelCase` | `async function login()` |
| **Variables** | `camelCase` | `const userId = 42;` |
| **React Components** | `PascalCase` | `const Navbar = () => { ... };` |

### 2.6. Error Handling

- Use **try/catch** in async functions that interact with external services.
- Convert low‑level errors to `Error` objects with meaningful messages.
- In Express, forward errors to the error‑handling middleware via `next(err)`.
- Do not swallow errors silently.
- For validation errors, return HTTP 400 with a JSON body describing the issue.

### 2.7. Logging

- Use a simple console logger (`console.log`, `console.error`).
- In production, consider a structured logger (e.g., `pino`), but for this starter repo console is fine.

### 2.8. Security

- Never log sensitive data (passwords, JWT secrets).
- Store secrets in `.env` only; never commit them.
- Hash passwords with `bcrypt` (12 rounds or `bcryptjs`).
- JWTs must be signed with a strong secret from `JWT_SECRET`.
- Use `helmet` middleware in Express for basic headers.

### 2.9. Testing

- Tests live under `tests/` with `.test.ts` suffix.
- Use Jest + Supertest for API integration tests.
- Keep tests deterministic: use `--runInBand` in CI.
- Mock external dependencies (e.g., database) if necessary.
- Test both success and failure paths.

### 2.10. Documentation

- Each module/file should start with a brief JSDoc comment describing its purpose.
- Inline comments should explain non‑obvious logic.
- Keep the README up to date with build, test, and deploy steps.

## 3. Cursor & Copilot Rules

- No cursor or copilot rules defined.

---

*This file aims to be a reference for all agents working on the project. Keep it up‑to‑date as the codebase evolves.*
