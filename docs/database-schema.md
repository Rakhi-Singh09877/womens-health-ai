# Database Schema

## Collections

### users

| Field | Type |
|--------|------|
| _id | Id |
| name | string |
| email | string |
| age | number |
| phone | string |
| createdAt | number |

---

### healthProfiles

| Field | Type |
|--------|------|
| _id | Id |
| userId | Id |
| bloodGroup | string |
| allergies | string[] |
| chronicConditions | string[] |
| medications | string[] |
| emergencyContact | string |

---

### symptomLogs

| Field | Type |
|--------|------|
| _id | Id |
| userId | Id |
| symptom | string |
| severity | number |
| notes | string |
| createdAt | number |

---

### healthRecords

| Field | Type |
|--------|------|
| _id | Id |
| userId | Id |
| title | string |
| fileUrl | string |
| uploadedAt | number |

---

### aiChats

| Field | Type |
|--------|------|
| _id | Id |
| userId | Id |
| prompt | string |
| response | string |
| createdAt | number |