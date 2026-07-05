# TTM Frontend Implementation Report

## Overview

The `Front/` directory now contains a complete React + Vite frontend for **TTM — Talk To Me**. No backend file was modified.

The implementation includes:

- Login and registration
- JWT-backed authentication persistence
- Protected application routes
- Responsive desktop, tablet, and mobile layouts
- Home feed and demo discovery view
- Post creation, editing, deletion, likes, and saves
- Post detail threads
- Comment creation, editing, and deletion
- Public and private profile experiences
- Follow, unfollow, pending, accepted, and rejected UI states
- Follow request acceptance and rejection UI
- Loading, error, empty, confirmation, and toast states
- A local demo session for portfolio review without seeded backend data

## Folder Structure

```text
Front/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Avatar.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Logo.jsx
│   │   │   └── Modal.jsx
│   │   ├── layout/
│   │   │   ├── AppShell.jsx
│   │   │   ├── MobileNav.jsx
│   │   │   ├── Navigation.jsx
│   │   │   └── RightSidebar.jsx
│   │   └── ui/
│   │       ├── CommentItem.jsx
│   │       ├── Composer.jsx
│   │       ├── FollowButton.jsx
│   │       └── PostCard.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── data/
│   │   └── demoData.js
│   ├── pages/
│   │   ├── Home/HomePage.jsx
│   │   ├── Login/LoginPage.jsx
│   │   ├── NotFound/NotFoundPage.jsx
│   │   ├── Notifications/NotificationsPage.jsx
│   │   ├── PostDetails/PostDetailsPage.jsx
│   │   ├── Profile/ProfilePage.jsx
│   │   └── Register/RegisterPage.jsx
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   └── ProtectedRoute.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.service.js
│   │   ├── comments.service.js
│   │   ├── follow.service.js
│   │   ├── likes.service.js
│   │   ├── posts.service.js
│   │   └── users.service.js
│   ├── styles/
│   │   └── index.css
│   ├── utils/
│   │   ├── demoStore.js
│   │   ├── errors.js
│   │   ├── formatters.js
│   │   └── jwt.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

## Installed Packages

Runtime:

- React
- React DOM
- React Router DOM
- Axios
- Lucide React

Development:

- Vite
- Vite React plugin
- ESLint
- React Hooks ESLint plugin
- React Refresh ESLint plugin
- React type packages

`npm install` completed with zero reported vulnerabilities.

## Routing Structure

| Route | Access | Purpose |
|---|---|---|
| `/login` | Public | Sign in or open the portfolio demo |
| `/register` | Public | Create an account and automatically sign in |
| `/` | Protected | Main feed |
| `/?view=discover` | Protected | Discovery presentation |
| `/profile` | Protected | Redirect to the current user's profile |
| `/profile/:id` | Protected | Public/private user profile |
| `/post/:id` | Protected | Post details and comments |
| `/notifications` | Protected | Follow request management |
| `*` | Public | Branded 404 page |

## State Management

- `AuthContext` owns authentication, session restoration, current-user data, logout, and demo mode.
- `ToastContext` owns global success, information, and error feedback.
- Page-local state owns feeds, comments, form state, pending interactions, modals, and optimistic UI.
- Axios adds the JWT bearer token to protected requests.
- The current session is persisted in `localStorage`.
- Demo-only content overrides are isolated in `demoStore.js` and never sent to the API.

## API Integration Summary

The frontend uses the existing endpoints exactly as implemented:

### Authentication

- `POST /auth/signup`
- `POST /auth/login`

### Users

- `GET /users/:id`
- `GET /users/:id/posts`

### Posts

- `GET /posts`
- `GET /posts/:id`
- `POST /posts`
- `PATCH /posts/:id`
- `DELETE /posts/:id`

### Comments

- `POST /comments` using the backend's `postedId` field
- `PATCH /comments/:id`
- `DELETE /comments/:id`

### Likes

- `POST /likes`
- `DELETE /likes/:id`

### Follows

- `POST /follow/:userId`
- `PATCH /follow/:followId/accept`
- `PATCH /follow/:followId/reject`
- `DELETE /follow/:followId`

## Authentication Behavior

- Login tokens are stored locally.
- The access-token payload is decoded to obtain the current user ID.
- The frontend then calls `GET /users/:id` to hydrate the current user.
- Signup is followed by login because signup does not return tokens.
- Any protected `401` response clears the session.

## Backend Constraints and Assumptions

These were documented rather than fixed because the backend is read-only.

1. **Follow enum casing is inconsistent.** Prisma defines `Accepted`, `Rejected`, and `Pending`, but follow acceptance/rejection and the private-post check use uppercase `ACCEPTED` and `REJECTED`. Those backend operations are expected to fail or never match until the backend casing is aligned.

2. **No follow relationship or request read endpoint exists.** The frontend can create, accept, reject, and delete a known follow record, but it cannot retrieve:
   - incoming follow requests,
   - the current relationship between two users,
   - a previous follow ID after a page reload.

   The request inbox is fully demonstrable in demo mode. In a real session it remains empty until the backend exposes request data.

3. **Existing like state is unavailable.** Post responses provide only like counts, not the current user's like, its ID, or a `likedByMe` flag. The UI can unlike a like created during the current session, but cannot reliably remove a pre-existing like because `DELETE /likes/:id` requires the like record ID.

4. **The global posts endpoint does not enforce private-account visibility.** `GET /posts` returns all posts and does not include the author's `isPrivate` value, so the frontend cannot safely filter private content by itself. Privacy enforcement must occur in the backend feed query.

5. **No token refresh endpoint exists.** The backend returns a refresh token, but there is no route that exchanges it for a new access token. The frontend logs the user out when the 15-minute access token is rejected.

6. **No current-user endpoint exists.** The frontend derives the user ID from the access token and uses `GET /users/:id`.

7. **No user search/list endpoint exists.** Real-account people suggestions and search cannot be populated. Demo mode shows representative suggestions.

8. **No profile update endpoint exists.** Profile data is displayed, but real profile editing cannot be submitted.

9. **Images are URL-based.** The backend accepts string image fields and exposes no upload endpoint, so post/comment image inputs use URLs.

## Validation Completed

- `npm run lint` passes.
- `npm run build` passes.
- Production bundle generation succeeds.
- Desktop login and feed layouts were visually checked.
- Mobile feed and bottom composer were checked at phone width.
- No horizontal mobile overflow was found.
- Demo post creation and persisted post-detail navigation were verified.
- Comment creation was verified.
- Private profile and pending request behavior were verified.
- Follow request acceptance was verified in demo mode.
- Browser console showed no warnings or errors during the tested flows.

## Run the Frontend

```bash
cd Front
copy .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

For a production bundle:

```bash
npm run build
npm run preview
```
