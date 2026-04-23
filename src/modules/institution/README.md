# Institution Portal Module Documentation

## Overview
This module handles all operations related to the 140+ campuses. It allows Institution Admins and Chapter Leads to manage their specific campus, organize local events, track student engagement, and configure campus-specific settings.

## Frontend (`/client`) Responsibilities
This is a localized dashboard for users with the `INST_ADMIN` or `CHAPTER_LEAD` roles.

### Key Components & Screens
1. **Campus Overview (`/institution/dashboard`)**: Snapshot of local campus health (active builders, recent projects from this campus, upcoming local events).
2. **Event Manager (`/institution/events`)**:
   - UI to create, edit, and delete campus-specific events (hackathons, workshops).
   - RSVP tracking and attendee lists.
3. **Student Directory (`/institution/students`)**: A localized list of students registered under this specific campus.
4. **Chapter Lead Management (`/institution/leads`)**: UI for Institution Admins to assign the `CHAPTER_LEAD` status to specific students.

### Rules
- All views must be filtered to show *only* data relevant to the logged-in user's assigned campus.
- Use the `useAuth()` hook to get the current user, and ensure they have the right permissions to view this portal.

---

## Backend (`/server`) Responsibilities
Manages the hierarchy of campuses, leads, and local events.

### Key Models (Mongoose)
1. **Campus**: `_id`, `name`, `domain` (e.g., '@mit.edu'), `status` (Pending, Active), `settings`.
2. **Event**: `_id`, `campusId` (String/ObjectId), `title`, `date`, `description`, `attendees` (Array of userIds).
3. **CampusMembership**: `userId`, `campusId`, `role` (Student, Lead, Admin). Maps users to campuses.

### Key API Routes (Mounted at `/api/v1/institution`)
- `POST /campuses`: Register a new campus (requires Super Admin approval).
- `GET /my-campus`: Get details of the campus the current user belongs to.
- `GET /my-campus/students`: Get a list of student IDs for this campus.
- `POST /events`: Create a new event for the campus.
- `GET /events`: List events for the campus.

### Inter-Module Communication

#### Data Hydration (Synchronous via Interfaces)
- **Fetching Student Data**: The `CampusMembership` only stores `userId`. To show a list of student names on the frontend, the backend controller must call `authInterface.getUsersByIds([userIds])` to attach names/emails before returning the API response.
- **Fetching Project Data**: To show recent projects built at the campus, call `builderInterface.getProjectsByUserIds([userIds])`.

#### Events Listened To
- `USER_REGISTERED`: Listen to this. Check the user's email domain. If it matches a `Campus.domain`, automatically create a `CampusMembership` linking that student to the campus.
- `INSTITUTION_APPROVED`: Emitted by the Admin module. Update the `Campus.status` to 'Active'.

#### Events Emitted
- `EVENT_CREATED`: Emitted when a new hackathon/workshop is scheduled. (The Builder module might listen to this to create an associated "Project Track" for students to submit to).
- `STUDENT_JOINED_CAMPUS`: Emitted when a user is linked to a campus.
