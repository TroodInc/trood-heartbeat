# Trood Heartbeat

Lightweight service that generates **project heartbeat updates** from GitHub activity and publishes them to Discourse communities.

**Every project should show visible progress without manual reporting.**

---

## Features

| Feature | Description |
|---------|-------------|
| **GitHub Activity Collector** | Fetches new/closed issues, merged PRs, new contributors, and good-first-issue labels |
| **Digest Builder** | Generates a structured Markdown summary |
| **Discourse Publisher** | Posts the digest to a Discourse category |
| **Scheduler** | Automatically publishes on a configurable interval (default: weekly) |
| **Admin UI** | Manage projects, add roadmap notes, preview & publish manually |
| **CLI Mode** | Generate digests from the command line for CI/testing |

---

## Architecture

```
GitHub API  ──▶  Heartbeat Engine  ──▶  Discourse API
                       │
                  PostgreSQL
                       │
                   Admin UI
```

GitHub is the **source of truth**. The engine observes, summarizes, and publishes—nothing more.

---

## Project Structure

```
trood-heartbeat/
├── src/
│   ├── server.js        # Express admin server
│   ├── scheduler.js     # Heartbeat scheduler
│   ├── github.js        # GitHub API integration
│   ├── discourse.js     # Discourse API integration
│   ├── digest.js        # Markdown digest builder
│   ├── db/
│   │   └── postgres.js  # Database access layer
│   └── ui/
│       ├── index.html   # Project list
│       └── project.html # Project detail / publish
├── heartbeat.js         # CLI entrypoint
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Quick Start

### Docker

`npm install` is **not** needed when you run with Docker.

```bash
git clone https://github.com/troodinc/trood-heartbeat.git
cd trood-heartbeat
cp .env.example .env
docker-compose up --build
```

Then open `http://localhost:3000`.

### Local Node.js

Use this path only if you want to run outside Docker:

```bash
npm install
node src/server.js
```

---

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token |
| `DISCOURSE_URL` | Discourse instance URL (e.g., `https://forum.example.com`) |
| `DISCOURSE_API_KEY` | Discourse API key |
| `DISCOURSE_API_USERNAME` | Discourse API username (e.g., `system`) |
| `DATABASE_URL` | PostgreSQL connection string. In Docker Compose, the internal value is already set |
| `PORT` | Server port (default: `3000`) |

---

## Database

Trood Heartbeat uses PostgreSQL. Tables are created automatically on first run.

**Tables:**

- `projects` – id, name, github_repo, discourse_category, discourse_topic, schedule_days, last_post_at, enabled
- `roadmap_notes` – id, project_id, content, created_at

---

## Running the Service

### Recommended: Docker Compose

```bash
docker-compose up --build
```

This starts:

- the `heartbeat` service
- a `postgres` database

The admin UI is available at `http://localhost:3000`.

### Local Node.js

```bash
npm install
node src/server.js
```

Use local mode only if PostgreSQL is already running and `DATABASE_URL` is set correctly.

---

## CLI Usage

Generate a heartbeat digest without publishing:

```bash
export GITHUB_TOKEN=ghp_xxx
node heartbeat.js --project owner/repo
```

Options:

| Flag | Description |
|------|-------------|
| `--project` | GitHub repository (`owner/repo`) – **required** |
| `--days` | Days to look back (default: `7`) |

Example:

```bash
node heartbeat.js --project octocat/Hello-World --days 14
```

Useful for CI pipelines and local testing.

---

## Admin Interface

Access at `http://localhost:3000/ui/`.

**Capabilities:**

- Add / edit / delete projects
- Bind GitHub repository and Discourse category or topic
- Set update interval (days)
- Add roadmap notes
- Preview the next heartbeat digest
- Publish manually (resets the schedule timer)

---

## Digest Format

```markdown
# Project Heartbeat

## New Issues
- [Issue title](url)

## Closed Issues
- [Issue title](url)

## Merged PRs
- [PR title](url) by @author

## New Contributors
- @username

## Good First Issues
- [Issue title](url)

## Roadmap
Optional notes from maintainers.
```

---

## Deployment Options

Trood Heartbeat can run:

- **Standalone** – `node src/server.js`
- **Docker** – `docker-compose up`
- **On-premise** – deploy behind a reverse proxy
- **Trood / OpenClaw pipelines** – integrate via CLI or API

---

## Discourse Publishing Modes

- **Category mode**
  - set `discourse_category`
  - each heartbeat becomes a new topic in that category

- **Topic mode**
  - set `discourse_topic`
  - each heartbeat becomes a reply in that existing project topic

If `discourse_topic` is set, it takes precedence over `discourse_category`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project with roadmap notes |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/notes` | Add roadmap note |
| DELETE | `/api/notes/:id` | Delete roadmap note |
| GET | `/api/projects/:id/preview` | Preview digest |
| POST | `/api/projects/:id/publish` | Publish digest now |

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

Please open an issue before submitting major changes.

**Areas for contribution:**

- Digest formatting improvements
- Additional data sources (e.g., releases, discussions)
- Scheduler enhancements
- Alternative publishing targets

---

## License

Apache 2.0
