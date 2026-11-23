# Local setup guide

## Prerequisites

- Docker Desktop with Docker Compose v2
- Git, if you plan to publish the repository

The Compose setup starts MongoDB, seeds demo data, starts the Express API, and serves the SvelteKit application.

## Run the complete application

From the repository root:

```bash
docker compose up --build
```

Open **http://localhost:5173** for the application and **http://localhost:4000/api-docs** for Swagger UI. MongoDB is available only to other Compose services and persists data in the `mongo_data` volume.

Demo logins:

| Role | Email | Password |
| --- | --- | --- |
| Employee | employee@teampulse.local | PulseDemo2026! |
| Manager | manager@teampulse.local | PulseDemo2026! |

Stop the services with `Ctrl+C`; run `docker compose down` to remove the containers while preserving data. `docker compose down -v` also deletes the local database volume.

## Run services without Docker

Install Node.js 20+ and MongoDB 7+, start MongoDB locally, then use two PowerShell terminals.

In the first terminal:

```powershell
cd server
npm install
$env:MONGO_URI = "mongodb://localhost:27017/teampulse"
$env:JWT_SECRET = "local-change-me-use-a-long-random-value"
npm run seed
npm run dev
```

In the second terminal:

```powershell
cd client
npm ci
npm run dev
```

The client defaults to `http://localhost:4000/api`. The existing `client/.env.production` keeps the deployed AWS API URL; Vite reads `VITE_API_URL` at build time. Set `CLIENT_ORIGIN` on the API to the browser origin.

## Configuration

See `.env.example`. Compose supplies local defaults. For a shared environment, set a unique, high-entropy `JWT_SECRET`, restrict CORS to the actual frontend origin, use TLS, and store secrets in an appropriate secret manager. Never commit `.env` files.

## Troubleshooting

- **Port already in use:** stop the process using 4000 or 5173, then rerun Compose.
- **API cannot connect to MongoDB:** check `docker compose ps`; Compose waits for the MongoDB health check before starting the API.
- **Login fails:** review `docker compose logs api` and confirm the seed command completed.
- **Reset demo data:** stop Compose, run `docker compose down -v`, then start it again. This permanently removes the local MongoDB volume.
