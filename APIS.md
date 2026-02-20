# Collabry Backend API Documentation

This document provides a comprehensive overview of the APIs available in the Collabry platform, including their purpose, flow, and edge cases.

---

# 1. User Authentication (`/v1/user-auth`)

Handles user lifecycle, authentication, and identity management.

## Endpoints

| Endpoint | Method | Description | Edge Cases |
|-----------|--------|------------|------------|
| `/signup` | POST | Registers a new user with the USER role. | Password mismatch, Email already exists, Invalid email format |
| `/login` | POST | Authenticates users (USER, INFLUENCER, ADMIN) and sets a JWT cookie. | Invalid credentials, Account suspended/inactive |
| `/me` | GET | Retrieves the current authenticated user's profile information. | Invalid or expired JWT |
| `/admin/create-influencer` | POST | Admin only. Creates an account with the INFLUENCER role. | Only accessible by Admin role, Email collision |
| `/logout` | POST | Clears the access_token cookie. | N/A |
| `/google` | GET | Initiates Google OAuth redirection flow. | N/A |
| `/google/callback` | GET | Handles Google OAuth callback and issues JWT. | Google profile missing email |
| `/forgot-password` | POST | Sends a password reset link to the user's email. | Returns success even if email not found (prevents enumeration) |
| `/reset-password` | POST | Resets password using token from email. | Invalid or expired token |

---

## Authentication Flow

### Signup/Login
1. User provides credentials.
2. Backend validates input.
3. JWT issued.
4. JWT stored as httpOnly cookie.

### Authorized Request
1. Browser sends cookie.
2. JwtStrategy validates token.
3. `req.user` populated.

### Password Reset
1. User requests reset.
2. Token generated and hashed.
3. Plain token emailed to user.
4. User submits new password + token.
5. Backend compares hash and updates password.

---

# 2. Influencer Management (`/v1/influencer`)

Specific to users with the INFLUENCER role.

## Endpoints

| Endpoint | Method | Description | Edge Cases |
|-----------|--------|------------|------------|
| `/profile` | GET | Returns influencer-specific profile. | Profile not found |
| `/profile` | POST | Creates or updates influencer profile. | Forbidden to non-influencers, Invalid niche/platform data |
| `/search` | GET | Search/filter influencers by niche, platform, followers, etc. | Empty result sets |
| `/:id` | GET | Retrieves influencer profile by ID. | Invalid UUID, Profile not found |

---

## Flow

1. Influencer registers/logs in.
2. Completes influencer profile:
   - Niche
   - Bio
   - Social media stats
3. Influencer profile is separate from generic `Profile` entity.

---

# 3. Generic Profile (`/v1/profile`)

Shared profile data for all users.

## Endpoints

| Endpoint | Method | Description | Edge Cases |
|-----------|--------|------------|------------|
| `/` | GET | Get current user's generic profile. | Profile not found |
| `/` | POST | Create or update current user's profile. | Username already taken |
| `/search` | GET | Search users by name or location. | N/A |
| `/:id` | GET | Get profile by ID. | Not found |

---

# 4. Collaboration Workflow (`/v1/collaboration`)

Core business logic for brand-influencer interactions.

## Endpoints

| Endpoint | Method | Description | Edge Cases |
|-----------|--------|------------|------------|
| `/` | POST | Request new collaboration. | Self-request, Target not influencer, Start date > End date |
| `/` | GET | List collaborations where user is requester or influencer. Supports `?status=` and `?search=` query params. | N/A |
| `/:id` | GET | Get collaboration details. | Forbidden if not involved |
| `/:id/status` | PATCH | Transition collaboration lifecycle. | Invalid state transitions, Role restrictions |
| `/:id` | PATCH | Update collaboration details. | Only requester can edit, Forbidden if Completed/Cancelled |
| `/:id` | DELETE | Remove collaboration request. | Only if status is REQUESTED |

---

## Status Flow


Rules:
- Cannot skip states.
- Invalid transitions rejected.
- Completed collaborations cannot be deleted.

---

# 5. Ranking & Scoring (`/v1/ranking`)

Calculates influencer score (0–100 scale).

## Endpoints

| Endpoint | Method | Description | Edge Cases |
|-----------|--------|------------|------------|
| `/breakdown/:id` | GET | View score calculation breakdown (0–100 score, 6 tiers). | Influencer not found |
| `/recalculate/:id` | POST | Admin only. Recalculate specific score & tier. | N/A |
| `/recalculate-all` | POST | Admin only. Trigger global recalculation. | N/A |
| `/weights` | GET/PATCH | Admin only. View/update ranking weights. | Weight validation required |

---

# 6. Messaging & Conversation (`/v1/messaging`)

Real-time communication between users.

## Endpoints

| Endpoint | Method | Description | Edge Cases |
|-----------|--------|------------|------------|
| `/conversation` | POST | Create or retrieve conversation. | N/A |
| `/conversation` | GET | List active chats. | N/A |
| `/conversation/:id/message` | POST | Send message. | User not part of conversation |
| `/conversation/:id/messages` | GET | Fetch chat history. | N/A |
| `/message/:id` | POST | Edit message. | Only sender |
| `/message/:id/delete` | POST | Delete message. | Only sender |

---

# 7. Administrative APIs (`/v1/admin`)

Privileged platform operations.

## Endpoints

| Endpoint | Method | Description | Edge Cases |
|-----------|--------|------------|------------|
| `/stats` | GET | Global metrics dashboard. | Forbidden to non-admin |
| `/reports` | GET/PATCH | View and resolve user reports. | N/A |
| `/verifications` | GET/PATCH | Process influencer verification requests. | N/A |
| `/subscription/plan` | POST/DELETE | Manage subscription tiers. | N/A |

---

# 8. Utility & Secondary APIs

| Endpoint | Purpose |
|-----------|---------|
| `/v1/verification` | Submit identity/influence verification documents |
| `/v1/uploads` | Direct-to-S3 uploads (Max 5MB) |
| `/v1/review` | Post-collaboration ratings and feedback |
| `/v1/report` | Report abusive or fraudulent users |
| `/v1/subscription` | View available pricing plans |

---

# System-Level Edge Cases & Policies

## Rate Limiting
- Login & Forgot Password: 3–5 requests per minute.

## Pagination
- Default: `page=1`
- Default limit: `limit=10`

## Delete Policies
- Collaborations cannot be deleted once past REQUESTED state.

## JWT Expiry
- Tokens valid for 7 days.

## Role Security
- Accessing `/admin/*` without admin role → `403 Forbidden`.

---

# Final Notes

- All sensitive operations require JWT authentication.
- Role-based guards enforce authorization.
- Ranking system recalculation may use background workers.
- Soft deletes preferred for historical integrity.

---

**End of Documentation**
