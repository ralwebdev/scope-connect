# Builder / Student Dashboard Module Documentation

## Overview
This is the core experience for the ~12,000 student members of Scope Connect. It is where they build their profiles, showcase projects, earn XP, view leaderboards, and find collaborators or project matches.

## Frontend (`/client`) Responsibilities
This is the primary user-facing application for the `STUDENT` role.

### Key Components & Screens
1. **Public Portfolio (`/builder/:username`)**: A public-facing page showcasing a student's bio, tech stack, and submitted projects.
2. **Student Dashboard (`/builder/dashboard`)**: Private view for the student to edit their portfolio, view their current XP, and track progress.
3. **Project Submission (`/builder/projects/new`)**: A form to submit new projects (links, descriptions, tags, associated hackathons/events).
4. **Project Gallery & Matching (`/builder/explore`)**: A feed of projects from all over the network. UI to find teams looking for members based on skills.
5. **Leaderboards (`/builder/leaderboard`)**: Gamified view showing top builders globally or filtered by campus.

### Rules
- Portfolios should be viewable by anyone, but editing is strictly protected for the owner.
- Use the `<Link>` component to route to the `/institution` pages if a project is tied to a specific campus event.

---

## Backend (`/server`) Responsibilities
Handles all the data related to what a student creates and their gamification progress.

### Key Models (Mongoose)
1. **Portfolio**: `_id`, `userId` (String/ObjectId), `bio`, `skills` (Array of Strings), `githubUrl`, `linkedInUrl`.
2. **Project**: `_id`, `ownerUserId` (String/ObjectId), `collaboratorIds` (Array of Strings), `title`, `description`, `techStack`, `repoUrl`, `eventId` (String/ObjectId - optional).
3. **XPRecord**: `_id`, `userId`, `amount`, `reason`, `createdAt`.

### Key API Routes (Mounted at `/api/v1/builder`)
- `GET /portfolio/:userId`: Fetch a student's portfolio and projects.
- `PUT /portfolio`: Update the logged-in user's portfolio.
- `POST /projects`: Submit a new project.
- `GET /projects`: List projects (with search/filter by tech stack).
- `GET /leaderboard`: Calculate and return top users by XP.

### Inter-Module Communication

#### Data Hydration (Synchronous via Interfaces)
- **User Info**: Both `Portfolio` and `Project` only hold `userId`. When returning a Project to the frontend, call `authInterface.getUserById(ownerUserId)` to attach the user's name and avatar.
- **Event Info**: If a project is tied to a campus event, call `institutionInterface.getEventById(eventId)` to attach the event name to the project card.

#### Events Listened To
- `USER_REGISTERED`: Emitted by Auth. Listen to this and automatically create a blank `Portfolio` document for the new user, and grant 10 XP for "Joining Scope Connect".
- `EVENT_CREATED`: Emitted by Institution. Store the event ID so it can be selected in the Project Submission form dropdown.

#### Events Emitted
- `PROJECT_SUBMITTED`: Emitted when a new project is created. (The Admin module might listen to update global stats).
- `XP_EARNED`: Emitted when XP is granted.
