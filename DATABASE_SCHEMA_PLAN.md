# Database Schema Plan — Scope Connect (MongoDB/Mongoose)

## 1. Overview
The database is designed to support a multi-role innovation network with students, institutions, and platform admins. Key design patterns include referencing for relationships and embedded sub-documents for domain-specific portfolio data.

---

## 2. Models

### 2.1 User
**Collection**: `users`
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | |
| `email` | String | Yes | Unique index |
| `password` | String | Yes | Bcrypt hashed |
| `role` | String | Yes | Enum: `student`, `campus_leader`, etc. |
| `campusId` | ObjectId | No | Ref: `campuses` |
| `bio` | String | No | |
| `skills` | [String] | No | |
| `interests` | [String] | No | |
| `xp` | Number | Yes | Default: 120 |
| `streak` | Number | Yes | Default: 1 |
| `lastLogin` | Date | Yes | |
| `availability`| String | Yes | Enum |
| `avatarColor` | String | Yes | |
| `links` | Object | No | `{ website, github, twitter, linkedin }` |
| `portfolio` | [PortfolioItem] | No | Embedded sub-documents |
| `trustScore` | Number | Yes | Default: 100 |

### 2.2 Campus / Institution
**Collection**: `institutions` (Handles both logical entities)
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | |
| `city` | String | Yes | |
| `state` | String | Yes | |
| `type` | String | Yes | Enum: `University`, `School`, etc. |
| `stage` | String | Yes | Enum: `Prospect`, `Live Chapter`, etc. |
| `ownerId` | ObjectId | No | Ref: `users` (Scope Admin) |
| `config` | Object | No | `{ logoText, departments, primaryColor }` |

### 2.3 Project (Builder Projects)
**Collection**: `projects`
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | |
| `description`| String | Yes | |
| `category` | String | Yes | Enum |
| `authorId` | ObjectId | Yes | Ref: `users` |
| `team` | String | No | |
| `votes` | [ObjectId]| No | Array of UserIds (for like tracking) |
| `cover` | String | No | Emoji or URL |

### 2.4 Opportunity (Gated Internships/Roles)
**Collection**: `opportunities`
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | |
| `type` | String | Yes | Enum: `internship`, `research`, etc. |
| `description`| String | Yes | |
| `institutionId`| ObjectId| No | Ref: `institutions` (for campus-only) |
| `status` | String | Yes | Enum: `open`, `closed`, `under_review` |
| `thresholds` | Object | Yes | `{ minReliability, minXp, minProjects }` |
| `createdBy` | ObjectId | Yes | Ref: `users` |

### 2.5 Opportunity Application
**Collection**: `applications`
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `opportunityId`| ObjectId| Yes | Ref: `opportunities` |
| `userId` | ObjectId | Yes | Ref: `users` |
| `status` | String | Yes | Enum: `submitted`, `shortlisted`, etc. |
| `statement` | String | Yes | |
| `portfolioLinks`| [String] | No | |
| `meritSnapshot` | Number | Yes | Calculated score at time of apply |

### 2.6 Daily Report
**Collection**: `daily_reports`
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `assignmentId`| ObjectId | Yes | Ref: `report_assignments` |
| `userId` | ObjectId | Yes | Ref: `users` |
| `dayKey` | String | Yes | Format: `YYYY-MM-DD` |
| `content` | Object | Yes | `{ tasksDone, hoursSpent, blockers }` |
| `submittedAt` | Date | Yes | |

### 2.7 Notification
**Collection**: `notifications`
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `userId` | ObjectId | Yes | Ref: `users` |
| `text` | String | Yes | |
| `type` | String | Yes | Enum: `milestone`, `system`, `action` |
| `read` | Boolean | Yes | Default: false |
| `href` | String | No | Link to route |

---

## 3. Indexes
- **User Email**: Unique index for authentication.
- **Report DayKey**: Compound index on `(assignmentId, dayKey)` to ensure one report per day.
- **Institution Stage**: Index for CRM pipeline performance.
- **Project Category**: Index for discovery filtering.

---

## 4. Relationships & Cleanup
- **Cascade Deletes**: If an Institution is deleted (rare), all related Campus Leader roles should be reset.
- **Orphan Prevention**: If a user is deleted, their Daily Reports should persist for project history but be anonymized or marked.
- **Normalization**: User XP and Streak are stored on the User model for performance, but an `xp_logs` collection should track history for audit.
