# API Endpoint Plan — Scope Connect

## 1. Authentication Module
| Method | Endpoint | Purpose | Auth Required | Roles Allowed |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/api/auth/signup` | Register new builder | No | All |
| POST | `/api/auth/login` | Login and get JWT | No | All |
| GET | `/api/auth/me` | Get current user session | Yes | All |

## 2. User & Portfolio Module
| Method | Endpoint | Purpose | Auth Required | Roles Allowed |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/users/:id` | Get public profile | Yes | All |
| PUT | `/api/users/profile` | Update own bio/skills | Yes | Student+ |
| GET | `/api/users/leaderboard`| Get national builder rank | Yes | All |
| POST | `/api/users/portfolio` | Add portfolio item | Yes | Student+ |

## 3. Projects & Feed Module
| Method | Endpoint | Purpose | Auth Required | Roles Allowed |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/feed` | Get recent activity | Yes | All |
| POST | `/api/feed` | Create a new post | Yes | Student+ |
| POST | `/api/feed/:id/like` | Toggle like on post | Yes | All |
| GET | `/api/projects` | List all builder projects | Yes | All |
| POST | `/api/projects` | Launch a new project | Yes | Student+ |

## 4. Institutions & CRM Module
| Method | Endpoint | Purpose | Auth Required | Roles Allowed |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/crm/institutions`| List all in pipeline | Yes | Scope Admin+ |
| POST | `/api/crm/institutions`| Add prospect institution | Yes | Scope Admin+ |
| PATCH | `/api/crm/:id/stage` | Move pipeline stage | Yes | Scope Admin+ |
| GET | `/api/institutions/:id`| Get institution hub data | Yes | Inst Admin+ |
| PATCH | `/api/institutions/:id`| Update inst profile | Yes | Inst Admin+ |

## 5. Opportunities & Applications
| Method | Endpoint | Purpose | Auth Required | Roles Allowed |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/opportunities` | List live opportunities | Yes | All |
| POST | `/api/opportunities` | Create new role/internship | Yes | Inst Admin+ |
| GET | `/api/opportunities/:id/eligibility` | Check eligibility | Yes | Student |
| POST | `/api/opportunities/:id/apply` | Submit application | Yes | Student |
| GET | `/api/applications` | List received apps | Yes | Inst Admin+ |
| PATCH | `/api/applications/:id` | Update app status | Yes | Inst Admin+ |

## 6. Daily Reporting Module
| Method | Endpoint | Purpose | Auth Required | Roles Allowed |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/reports/my` | Get current assignments | Yes | Student |
| POST | `/api/reports` | Submit daily update | Yes | Student |
| GET | `/api/reports/team` | Reviewer dashboard | Yes | Faculty/Admin |
| POST | `/api/reports/recover` | Request penalty recovery | Yes | Student |
| PATCH | `/api/reports/recover/:id`| Approve recovery | Yes | Faculty/Admin |

---

## 7. Global Search & Analytics
| Method | Endpoint | Purpose | Auth Required | Roles Allowed |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/search` | Global search for people/projects | Yes | All |
| GET | `/api/analytics/global` | Global platform metrics | Yes | Super Admin |
| GET | `/api/analytics/inst/:id`| Institutional DAU/WAU | Yes | Inst Admin |

---

## 8. Error Response Format
All endpoints should return a consistent JSON structure for errors:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Email is already in use" }
  ]
}
```
