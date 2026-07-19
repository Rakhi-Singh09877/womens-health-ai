# Women's Health AI - System Architecture

---

# Overview

Women's Health AI is an AI-powered healthcare platform designed to provide personalized health assistance, symptom tracking, secure health record management, and AI-driven recommendations.

The application follows a modern full-stack architecture using Next.js for the frontend, Convex for backend services, and Enter Pro for AI-powered health assistance.

---

# High Level Architecture

```
                 User
                   │
                   ▼
         Next.js Frontend
                   │
                   ▼
           Services Layer
                   │
                   ▼
          Convex Backend
          (Queries/Mutations)
                   │
                   ▼
          Convex Database
                   │
                   ▼
        Enter Pro AI Services
```

---

# Technology Stack

## Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS

## Backend

- Convex
- Convex Authentication
- Convex Database
- Convex Functions

## AI Services

- Enter Pro (Hackathon Requirement)
- AI Chat
- Personalized Recommendation Engine

## Deployment

- Vercel
- Convex Cloud
- GitHub

---

# Application Modules

## Authentication

- Login
- Signup
- User Profile

---

## Dashboard

- Health Summary
- Recent Activities
- Quick Actions

---

## Symptom Tracker

- Daily Symptoms
- Symptom History
- Severity Tracking

---

## Health Records

- Medical Reports
- Prescriptions
- Upload Documents

---

## AI Assistant

- Chat Interface
- Personalized Recommendations
- Health Suggestions

---

## Settings

- Profile
- Privacy
- Notifications

---

# Folder Responsibilities

## app/

Application routes and pages.

## components/

Reusable UI components.

## convex/

Backend schema, queries, mutations and authentication.

## docs/

Project documentation.

## hooks/

Reusable React Hooks.

## lib/

Shared libraries and helper functions.

## services/

Communication between frontend and backend.

## types/

TypeScript interfaces and models.

## utils/

Utility functions.

---

# Request Flow

```
User

↓

Frontend

↓

Service Layer

↓

Convex Query / Mutation

↓

Database

↓

Response

↓

Frontend

↓

User
```

---

# Authentication Flow

```
User

↓

Login / Signup

↓

Convex Authentication

↓

Session Validation

↓

Protected Dashboard
```

---

# AI Processing Flow

```
User Input

↓

Frontend

↓

Convex Backend

↓

Enter Pro AI

↓

Generated Response

↓

Frontend

↓

User
```

---

# Development Workflow

## Member 1

Backend Development

Responsible for:

- Database Schema
- Authentication
- Queries
- Mutations
- Business Logic

---

## Member 2

Frontend Development

Responsible for:

- UI Components
- Dashboard
- Responsive Design
- User Experience

---

## Member 3 (Project Lead)

Responsible for:

- Architecture
- Integration
- Git Management
- Documentation
- Testing
- Deployment
- Team Coordination

---

# Deployment Architecture

Frontend → Vercel

Backend → Convex Cloud

Source Code → GitHub

---

# Development Rules

- Frontend and Backend are developed independently.
- Every feature must have its own branch.
- Code must be reviewed before merging.
- Integration is performed only after frontend and backend milestones are completed.
- All features must pass testing before deployment.