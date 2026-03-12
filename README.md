# Trood Heartbeat

Trood Heartbeat is a lightweight service that generates **project heartbeat updates** from GitHub activity and publishes them to Discourse communities.

The goal is simple: **every project should show visible progress without manual reporting.**

Trood Heartbeat observes repository activity and periodically publishes digest updates summarizing:

- new issues
- closed issues
- merged pull requests
- new contributors
- optional roadmap notes from maintainers

The service runs automatically but allows maintainers to preview and publish updates manually.

---

# Why Trood Heartbeat Exists

Open-source and internal projects often struggle with **visibility**.

When contributors cannot see progress, they assume the project is inactive.

Trood Heartbeat solves this by ensuring that every project produces a regular activity signal.

Instead of writing weekly reports manually, maintainers can rely on automated summaries.

The system follows three principles:

- **GitHub is the source of truth**
- **Automation should reduce work, not create processes**
- **KISS (Keep It Simple)**

---

# Key Features

## Automated Project Digests

Trood Heartbeat periodically analyzes activity in a repository and generates a digest including:

- newly opened issues
- recently closed issues
- merged pull requests
- new contributors

Example output:

"
Project Heartbeat

New Issues
• Improve Medium parser
• Add Substack ingestion

Closed Issues
• Fix Telegram extraction bug

Merged PRs
• Parser refactor by @alice

New Contributors
• @bob

Roadmap
Next week we focus on stabilizing the ingestion pipeline.

"


---

## Discourse Publishing

Heartbeat updates can be automatically published to communities running Discourse.

This keeps the community informed without manual reporting.

---

## Admin Preview

Maintainers can:

- preview the next heartbeat
- add roadmap comments
- publish an update manually

Manual publishing resets the schedule.

---

## Scheduled Automation

By default, Trood Heartbeat publishes updates **weekly**.

The scheduler checks each project and publishes a digest when it becomes due.

---

## CLI Mode

Trood Heartbeat can also run as a CLI tool.

Example:

node heartbeat.js --project owner/repo


This generates the heartbeat digest without publishing.

Useful for testing or CI pipelines.

---

# Architecture

Trood Heartbeat is intentionally small.


GitHub → Heartbeat Engine → Discourse


GitHub provides the activity data.

The heartbeat engine builds a digest.

The digest is published to Discourse.

An optional admin UI allows configuration and manual publishing.

---

# Project Structure


trood-heartbeat

/src
server.js Admin interface
scheduler.js Update scheduler
github.js GitHub activity collector
discourse.js Discourse publisher
digest.js Digest builder

/src/ui
index.html
project.html

/src/db
postgres.js

heartbeat.js CLI entry point

Dockerfile
docker-compose.yml
README.md


---

# Installation

Clone the repository:


git clone https://github.com/trood/trood-heartbeat

cd trood-heartbeat


Install dependencies:


npm install


---

# Configuration

Trood Heartbeat uses environment variables.

Required variables:


GITHUB_TOKEN=
DISCOURSE_URL=
DISCOURSE_API_KEY=
DISCOURSE_API_USERNAME=
DATABASE_URL=


The database should be a PostgreSQL instance.

---

# Running the Service

Start the server:


node src/server.js


The scheduler will run automatically.

---

# Docker

Build the image:


docker build -t trood-heartbeat .


Run the container:


docker run trood-heartbeat


Or use docker-compose:


docker-compose up


---

# Admin Interface

The admin UI allows maintainers to:

- add projects
- bind GitHub repositories
- bind Discourse categories
- add roadmap notes
- preview heartbeat updates
- publish updates manually

Manual publishing resets the schedule.

---

# Use Cases

Trood Heartbeat works well for:

- open-source communities
- internal engineering teams
- startup product updates
- ecosystem coordination

Any project that benefits from **transparent progress updates**.

---

# Trood Ecosystem

Trood Heartbeat is part of the broader Trood ecosystem, which focuses on automation and AI-assisted software development workflows.

The service can run:

- standalone
- in on-premise environments
- inside OpenClaw deployments

---

# Contributing

Contributions are welcome.

Typical contributions include:

- improving digest formatting
- adding additional data sources
- improving scheduler logic
- expanding community integrations

Please open an issue before submitting major changes.

---

# License

Apache 2.0
