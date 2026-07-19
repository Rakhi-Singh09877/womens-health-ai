# Setup Guide

## Prerequisites

- Node.js 24+
- npm
- Git
- VS Code

---

## Clone Repository

```bash
git clone https://github.com/Rakhi-Singh09877/womens-health-ai.git
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Copy

```
.env.example
```

to

```
.env.local
```

Configure:

- CONVEX_DEPLOYMENT
- NEXT_PUBLIC_CONVEX_URL
- NEXT_PUBLIC_CONVEX_SITE_URL

---

## Start Convex

```bash
npx convex dev
```

---

## Start Next.js

```bash
npm run dev
```

---

## Run Lint

```bash
npm run lint
```

---

## Build

```bash
npm run build
```

---

## Git Workflow

Create feature branch

```bash
git checkout develop

git pull

git checkout -b feature/<feature-name>
```

Commit frequently.

Push regularly.

Never commit directly to main.