# API Contract

This document defines the communication between the frontend and backend.

---

# Authentication

## POST /auth/signup

### Request

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "********"
}
```

### Response

```json
{
  "success": true,
  "userId": "..."
}
```

---

## POST /auth/login

### Request

```json
{
  "email": "jane@example.com",
  "password": "********"
}
```

### Response

```json
{
  "token": "...",
  "user": {}
}
```

---

# Health Profile

## GET /profile

Returns user profile.

---

## PUT /profile

Updates health profile.

---

# Symptom Tracker

## GET /symptoms

Returns all symptom logs.

---

## POST /symptoms

Creates new symptom log.

---

## DELETE /symptoms/:id

Deletes symptom.

---

# Health Records

## GET /records

Returns uploaded records.

---

## POST /records

Uploads health record.

---

# AI Assistant

## POST /ai/chat

Request

```json
{
  "message": "I have a headache."
}
```

Response

```json
{
  "reply": "..."
}
```