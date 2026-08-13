# HackRadar

> An open-source initiative making hackathon discovery more accessible, transparent, and community-driven.

HackRadar is an open-source platform that discovers hackathons from multiple public platforms, normalizes them into a common structure, removes duplicate listings, and makes them searchable through a single interface.

But HackRadar is more than a hackathon directory.

We are building it as a **community-driven open-source initiative** where developers, designers, researchers, organizers, and contributors can help improve how hackathons are discovered and accessed.

---

## ✨ What is HackRadar?

Hackathons are scattered across dozens of platforms, communities, and websites.

Finding the right one often means:

- searching multiple websites
- checking deadlines manually
- dealing with inconsistent information
- discovering duplicate listings
- missing opportunities because they are difficult to find

HackRadar aims to make that process simpler.

### The idea

```text
Public Hackathon Sources
        ↓
   Source Adapters
        ↓
      Crawler
        ↓
   Normalization
        ↓
   Deduplication
        ↓
    PostgreSQL
        ↓
     Public API
        ↓
    HackRadar UI
````

HackRadar collects publicly available hackathon information, converts it into a consistent structure, and presents it through a searchable discovery experience.

---

# 🎯 Our Mission

HackRadar is being developed as an open-source initiative with a simple goal:

> **Make hackathon opportunities easier to discover and more accessible to everyone.**

We believe opportunity discovery should not depend on already knowing which platforms to search.

The project is built around:

* Open source
* Accessibility
* Transparency
* Community contribution
* Source attribution
* Responsible data handling
* Developer collaboration

---

# 🔎 Discover Hackathons

HackRadar provides a centralized discovery experience for hackathons collected from supported sources.

Users can:

* Search hackathons
* Filter by status
* Filter by mode
* Filter by theme
* Filter by country
* Sort results
* View hackathon details
* Follow the official source link
* Report incorrect information

The official source remains the authority for registration, deadlines, rules, and other event details.

HackRadar is a discovery layer — not the organizer of the hackathons listed on the platform.

---

# 🏗️ Architecture

HackRadar uses an adapter-based crawling architecture.

## Data pipeline

```text
┌─────────────────────┐
│  External Sources   │
│  Public platforms   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Source Adapters   │
│ Platform-specific   │
│ extraction logic    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│       Crawler       │
│ Discovery & parsing │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│    Normalization    │
│ Canonical structure │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Deduplication     │
│ Unique event data   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     PostgreSQL      │
│ Persistent storage  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     Public API      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│    HackRadar UI     │
└─────────────────────┘
```

The repository separates the frontend, backend, crawler infrastructure, and database layer while keeping the system in a single repository.

---

# 🧰 Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Radix UI primitives
* React Router
* TanStack Query
* Vitest

## Backend

* Node.js
* TypeScript
* PostgreSQL
* Drizzle ORM
* Playwright
* Cheerio
* Custom HTTP server
* ts-node

## Infrastructure

* PostgreSQL / Neon-compatible database
* SMTP for initiative application notifications
* GitHub for source code and collaboration

---

# 📁 Repository Structure

```text
HackRadar/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── data/
│   │   └── test/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── crawler/
│   │   │   ├── adapters/
│   │   │   └── core/
│   │   ├── db/
│   │   ├── services/
│   │   ├── validators/
│   │   └── server.ts
│   │
│   ├── db/
│   │   └── migrations/
│   │
│   └── package.json
│
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── README.md
```

---

# 🚀 Running HackRadar Locally

## Prerequisites

Make sure you have:

* Node.js
* npm
* PostgreSQL
* Git

Clone the repository:

```bash
git clone https://github.com/ZainabTravadi/List-Of-Hackathons.git

cd List-Of-Hackathons
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will start using the Vite configuration in the repository.

---

## Backend

Open another terminal:

```bash
cd backend
npm install
npm run dev
```

The backend provides the API and crawler infrastructure.

---

# 🔐 Environment Variables

The backend uses environment variables for configuration.

Create:

```text
backend/.env
```

Never commit this file.

Typical configuration includes:

```env
DATABASE_URL=your_postgresql_connection_string

SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

RECEIVE_EMAIL=your_notification_email
```

The SMTP configuration is used for notifications when someone submits the **Join the Initiative** form.

Keep credentials and database connection strings private.

---

# 🗄️ Database

HackRadar uses PostgreSQL with Drizzle ORM.

The database contains normalized hackathon information as well as supporting crawler state and initiative application data.

The initiative application flow stores submissions in:

```text
initiative_applications
```

Applications are not exposed through a public GET endpoint.

The server validates submissions before inserting them into the database.

---

# 🤝 Join the Initiative

HackRadar is intentionally designed so that people can contribute beyond writing scraper code.

You can contribute through:

* Frontend development
* Backend development
* Crawler development
* Source adapters
* Data quality
* Testing
* Accessibility
* Documentation
* Design
* Community
* Outreach
* Translation
* Partnerships
* Other useful contributions

If you are interested in helping:

**Visit the Join the Initiative page on the website.**

Submitted applications are stored securely in PostgreSQL and a notification is sent to the project maintainer through SMTP.

---

# 🧑‍💻 How You Can Contribute

Some useful contribution areas include:

### 🔌 Source Adapters

Add or improve adapters for supported hackathon platforms.

Adapters are responsible for extracting platform-specific information and converting it into HackRadar's canonical event structure.

See:

```text
backend/src/crawler/adapters/
```

for the existing adapter architecture.

---

### 🎨 Frontend

Improve:

* Discovery UX
* Accessibility
* Responsive layouts
* Hackathon cards
* Search and filtering
* Contributor experiences
* Documentation
* Visual design

---

### ⚙️ Backend

Improve:

* API performance
* Data processing
* Validation
* Database queries
* Crawler infrastructure
* Reliability
* Testing

---

### 🧪 Testing

Help us improve confidence in:

* Crawlers
* Adapters
* API behavior
* Frontend components
* Forms
* Data normalization

---

### 📚 Documentation

Documentation is one of the easiest ways to make an open-source project more welcoming.

You can improve:

* Setup instructions
* Adapter documentation
* API documentation
* Architecture documentation
* Contributor onboarding

---

### ♿ Accessibility

Help make HackRadar usable by more people.

Accessibility contributions are welcome across:

* Keyboard navigation
* Screen readers
* Focus states
* Contrast
* Forms
* Responsive layouts
* Reduced motion
* Semantic HTML

---

# 🛠️ Development Principles

HackRadar follows a few important principles.

### 1. Preserve source attribution

HackRadar should make it clear where hackathon information originated.

The official source remains authoritative.

### 2. Don't fabricate information

We don't invent:

* Hackathon details
* Contributor statistics
* Impact metrics
* Partnerships
* Funding
* Community numbers

If reliable data isn't available, we prefer an honest empty state.

### 3. Keep the crawler modular

Source-specific extraction logic should remain inside adapters rather than becoming tightly coupled to the rest of the crawler.

### 4. Protect user-submitted information

Initiative applications should not be publicly exposed.

Credentials and secrets must never be committed to the repository.

### 5. Accessibility matters

A polished interface should also be usable.

### 6. Community over vanity metrics

Contributor recognition should encourage meaningful contribution rather than optimizing for meaningless numbers.

---

# 🔍 Transparency

HackRadar is being built in the open.

The website includes a dedicated transparency section explaining:

* How data is discovered
* How adapters work
* How data is normalized
* How duplicates are handled
* How data reaches the API
* How source attribution is preserved

The project roadmap and governance principles are also publicly documented.

---

# 🗺️ Roadmap

HackRadar is continuously evolving.

Current areas of development include:

* Better discovery
* More source adapters
* Data quality improvements
* Accessibility
* Contributor tooling
* Documentation
* Community infrastructure
* Better transparency
* Improved project observability

The public roadmap is intentionally flexible because the direction of an open-source project should also respond to its contributors.

---

# 🐛 Reporting Incorrect Information

HackRadar aggregates information from external sources.

Sometimes information can become outdated or be parsed incorrectly.

If you notice incorrect information on a listing, use the **Report incorrect information** option on the hackathon detail page.

Reports should help us improve data quality without modifying the original source.

---

# 🔒 Security

If you discover a security vulnerability, please follow the responsible disclosure process described in:

```text
SECURITY.md
```

Do not publicly disclose sensitive vulnerabilities before the project has had an opportunity to investigate them.

---

# 🤝 Community Guidelines

HackRadar aims to be a welcoming environment for contributors from different technical backgrounds and experience levels.

Please read:

```text
CODE_OF_CONDUCT.md
```

before contributing.

---

# 📖 Documentation

Additional documentation is available through:

* `CONTRIBUTING.md`
* `backend/src/crawler/adapters/README.md`
* Project API documentation
* Transparency page
* Governance page
* Roadmap

---

# 🌱 Why Open Source?

Hackathon discovery is an ecosystem problem.

There are many platforms, communities, organizers, and participants — but discovering opportunities remains fragmented.

An open-source approach allows the people who actually use these ecosystems to help improve the infrastructure.

HackRadar is therefore not intended to be just another private directory.

It is an experiment in building **community-owned discovery infrastructure**.

---

# ⭐ Contributing

If HackRadar sounds useful, there are several ways to help:

1. Use it.
2. Report incorrect information.
3. Open an issue.
4. Improve documentation.
5. Fix a bug.
6. Improve accessibility.
7. Build or improve an adapter.
8. Contribute frontend or backend improvements.
9. Help other contributors get started.
10. Share ideas for the future of the project.

Start with:

```text
CONTRIBUTING.md
```

---

# 📌 Project Status

HackRadar is an actively developed open-source initiative.

The crawler, backend API, database layer, discovery interface, contributor infrastructure, and initiative application system are under continuous development.

Features and architecture may evolve as the project grows.

---

## Built in the Open

HackRadar is built with the belief that discovering opportunities should be easier than discovering where to look for them.

If you want to help build that future:

**Join the initiative.**
And honestly? This README now makes the project sound like what we're actually building: **not “Jennie's hackathon scraper,” but a community infrastructure project.** That's the positioning I want.
