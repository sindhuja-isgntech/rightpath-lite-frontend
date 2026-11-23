# RightPath – Frontend

Web client for **RightPath**, a recruitment platform where candidates browse and apply for jobs, and admins post jobs and review applications.

Built with React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 and Axios. It talks to the Spring Boot backend in `../../rightpath-backend`.

## Features

**Candidate**
- Register, log in, reset-password page
- Dashboard with application count
- Job Events: browse open jobs and apply
- Applied Jobs: track the status of each application (Applied, Shortlisted, Selected, Rejected)
- In-app notifications when an application status changes

**Admin**
- Dashboard overview
- Job Events: create, edit, view details and archive jobs; see the candidates who applied to each job
- Applications: review all applications and move them through the status workflow

Access is role based (`CANDIDATE` / `ADMIN`). Signing in sends each user to their own home page, and a candidate cannot open admin pages.

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 20 or newer (LTS recommended) |
| npm | 10 or newer (ships with Node) |
| Java (backend) | 21 |
| PostgreSQL (backend) | 14 or newer |

## Environment setup

The frontend needs the backend running, so set up both.

### 1. Database

Create an empty PostgreSQL database:

```sql
CREATE DATABASE rightpath;
```

Tables are created automatically on the first backend start (`ddl-auto: update`).

### 2. Backend (`rightpath-backend`)

Secrets are never committed. The backend reads them from a git-ignored `.env` file.

```bash
cd rightpath-backend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `.env`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DB_URL` | JDBC URL | `jdbc:postgresql://localhost:5432/rightpath` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | required |
| `JWT_SECRET` | HS256 signing key, at least 32 characters (`openssl rand -base64 48`) | required |
| `JWT_EXPIRATION_MS` | Token lifetime in ms | `86400000` (24 h) |
| `ADMIN_EMAIL` | First admin account email | empty |
| `ADMIN_PASSWORD` | First admin account password (empty = no admin is created) | empty |

Start it:

```bash
./mvnw spring-boot:run       # Windows: .\mvnw.cmd spring-boot:run
```

The API runs on <http://localhost:8080/api>. Swagger UI is at <http://localhost:8080/swagger-ui/index.html>.

> After changing backend code or `.env`, **restart** the backend. A previously started instance keeps serving the old code.

### 3. Frontend

```bash
cd rightpath-frontend/frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The API base URL is set in `src/services/api.ts` (`http://localhost:8080/api`). The backend only allows CORS from `http://localhost:5173`, so keep the dev server on that port, or update `SecurityConfig` if you change it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Signing in

- **Admin:** use `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the backend `.env`.
- **Candidate:** use the Register page (`/register`), then log in.

## Project structure

```
src/
├── components/   Layout, sidebar (navItems.ts), modals, job dialogs, notifications
├── context/      AuthContext and AuthProvider (JWT session)
├── pages/        Login, Register, Dashboard, JobListings, AppliedJobs,
│                 AdminDashboard, AdminJobEvents, AdminApplications, NotFound
├── services/     api.ts – Axios instance with Bearer-token interceptor
├── types/        Shared TypeScript types (job, application, user)
├── utils/        Status labels/styles, job state helpers, document title hook
├── App.tsx       Route table
└── main.tsx      Entry point
```

## Authentication

The login response returns a JWT, stored in `localStorage` under the key `token`. An Axios interceptor adds it as `Authorization: Bearer <token>` to every request. `ProtectedRoute` guards pages by role.

Backend responses: `401` when the token is missing or invalid, `403` when the user is signed in but lacks the role.

## Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| Blank page or network errors on login | Backend is not running, or CORS blocks a port other than 5173 |
| Backend fails with "Could not resolve placeholder" | `.env` is missing, or `DB_PASSWORD` / `JWT_SECRET` is not set |
| Backend rejects the JWT secret | `JWT_SECRET` is shorter than 32 characters |
| Behaviour doesn't match recent code changes | An old backend process is still on port 8080. Stop it and restart |
| Swagger UI error | Same cause: restart the backend |
| No admin account | Set `ADMIN_PASSWORD` in `.env` and restart; the admin is created only if it doesn't exist |

## Security notes

- Never commit `.env`, passwords or JWT secrets. `.env` is git-ignored; only `.env.example` (placeholders) is committed.
- Use a long, random `JWT_SECRET` and a strong admin password outside local development.

## Not implemented yet

Assessments, interviews, exams, results and resume management have no backend. The dashboard shows `0` for their stat cards.
