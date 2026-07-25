# Women's Health AI

> AI-powered women's health platform built for the hackathon using Next.js, Convex and Enter Pro.

---

## Problem Statement

Women often face difficulties accessing reliable, personalized, and timely healthcare guidance. Existing solutions are fragmented, difficult to understand, or unavailable when immediate assistance is needed.

Our goal is to build an AI-powered platform that provides a modern, secure and intelligent healthcare experience for women.

---

# Solution

Women's Health AI combines artificial intelligence with a modern web application to provide:

- AI-assisted health guidance
- Symptom tracking
- Health record management
- Personalized recommendations
- Secure user authentication
- Modern responsive dashboard

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Enter Pro (Hackathon)

## Backend

- Convex
- Convex Authentication
- Convex Database
- Convex Functions
- Grok API (xAI)

## Development

- Git
- GitHub
- VS Code

---

# Project Structure

```
womens-health-ai/

├── app/
├── components/
├── convex/
├── docs/
├── hooks/
├── lib/
├── public/
├── services/
├── types/
└── utils/
```

---

# Team Responsibilities

## Member 1

Backend Development

- Convex Database
- Authentication
- API Functions
- Business Logic

---

## Member 2

Frontend Development

- UI
- Components
- Dashboard
- Responsive Design
- Enter Pro Integration

---

## Member 3 (Project Lead)

- Architecture
- Integration
- Git Management
- Documentation
- Code Review
- Testing
- Deployment
- Team Coordination

---

# Git Workflow

```
main
│
├── develop
│
├── feature/backend
│
├── feature/frontend
│
└── feature/integration
```

Every feature is developed independently and merged into the develop branch after review.

---

# Development Status

- [x] Repository Initialized
- [x] Next.js Setup
- [x] Convex Setup
- [x] Folder Structure
- [x] Git Strategy
- [ ] Backend Development
- [ ] Frontend Development
- [ ] Integration
- [ ] Testing
- [ ] Deployment

---

# Getting Started

Install dependencies

```bash
npm install
```

Start Next.js

```bash
npm run dev
```

Start Convex

```bash
npx convex dev
```

## AI Configuration

The backend uses xAI's Grok API for symptom-pattern analysis. Set these Convex
environment variables before running or deploying the backend:

```bash
npx convex env set XAI_API_KEY <your-xai-api-key>
npx convex env set XAI_MODEL grok-2-latest # optional
```

`XAI_MODEL` defaults to `grok-2-latest` when it is not set.

---

# License

This project was developed for a Hackathon and is intended for educational and demonstration purposes.
