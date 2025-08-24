# SocialConnect

A modern social networking platform built with Next.js (App Router) + TypeScript + Supabase providing real‑time social features: global feed, posts with images, comments, likes, follows, notifications, profile management, and an admin moderation dashboard.

---

## ✨ Core Features

### Authentication & Accounts

- Email + password registration & login
- Secure Supabase Auth session management (server & route helpers)
- Password reset + confirmation flow
- Token refresh endpoint
- Logout (with UI loading states)

### User Profiles

- Editable profile (avatar, bio, website, location)
- Public profile pages (`/users/[id]`)
- Basic stats (posts, followers, following)

### Social Graph

- Follow / Unfollow users
- Followers & Following counts (live queried for self)

### Posts

- Create text & image posts (image upload via `/api/uploads/image`)
- Global feed (`/feed`) with aggregated like & comment counts
- User posts list in profile
- Admin ability to list & delete posts

### Interactions

- Likes (with like status & count per post)
- Comments (list & count aggregation)
- Trending hashtags extraction (simple regex on feed)

### Notifications

- Stored notifications with unread count
- Real‑time bell component + mark all read
- Individual notification read endpoint

### Admin Dashboard

- Admin flag on profile (`is_admin`)
- Protected admin API routes under `/api/admin/*`
- Manage: Users, Posts, Comments, Basic Stats
- Deactivate user route
- Admin‑only sidebar action (Shield icon) when logged in as admin

### File Uploads

- Image uploads (validated & stored via Supabase storage)

### UI / UX

- Responsive layout with left & right sidebars on large screens
- Accessible dropdown menus & buttons (shadcn/ui + Radix primitives)
- Loading states & skeleton / suspense placeholders
- Animated spinners for auth + logout actions
- Theming via Tailwind + CSS variables

### Tech Stack

| Layer                | Technology                                      |
| -------------------- | ----------------------------------------------- |
| Framework            | Next.js 14 App Router                           |
| Language             | TypeScript                                      |
| Auth & DB & Realtime | Supabase (Postgres + Auth + Realtime + Storage) |
| Styling              | Tailwind CSS + custom design tokens             |
| UI Components        | shadcn/ui (Radix) + custom components           |
| Icons                | Lucide React                                    |
| Deployment           | Vercel (recommended)                            |

---

## 🗂 High‑Level Structure (simplified)

```
src/app/
  auth/                # Login, signup, password flows
  feed/                # Global feed + sidebars
  profile/             # Authenticated user profile editor
  users/[id]/          # Public profile page
  new-post/            # Post creation UI
  notifications/       # Notification center
  admin/               # Admin dashboard (gated)
  api/                 # Route handlers (REST-ish endpoints)
    auth/*             # Auth operations
    posts/*            # Post CRUD-ish + likes + comments
    comments/*         # Comment operations
    users/*            # User & follow actions
    notifications/*    # Notification actions
    uploads/image      # Image upload
    admin/*            # Admin moderation endpoints
  components/          # Reusable presentational & logic components
  lib/                 # Supabase clients, utilities
```

---

## 🔐 API Endpoints (Selected)

(All routes live under `src/app/api/*` using Next.js Route Handlers.)

| Category      | Endpoint                           | Method     | Description                     |
| ------------- | ---------------------------------- | ---------- | ------------------------------- |
| Auth          | `/api/auth/register`               | POST       | Register new user               |
| Auth          | `/api/auth/login`                  | POST       | Login (email or username)       |
| Auth          | `/api/auth/logout`                 | POST       | Logout current session          |
| Auth          | `/api/auth/change-password`        | POST       | Change password (authenticated) |
| Auth          | `/api/auth/password-reset`         | POST       | Request password reset          |
| Auth          | `/api/auth/password-reset-confirm` | POST       | Confirm password reset          |
| Auth          | `/api/auth/token/refresh`          | POST       | Refresh access token            |
| Posts         | `/api/posts`                       | GET/POST   | List or create posts            |
| Posts         | `/api/posts/[id]`                  | GET/DELETE | Get or delete a post            |
| Posts         | `/api/posts/[id]/comments`         | GET/POST   | List or add comment             |
| Posts         | `/api/posts/[id]/like`             | POST       | Toggle like                     |
| Posts         | `/api/posts/[id]/like-status`      | GET        | Check like state                |
| Comments      | `/api/comments/[id]`               | DELETE     | Delete a comment (owner/admin)  |
| Feed          | `/api/feed`                        | GET        | Composite feed query            |
| Users         | `/api/users`                       | GET        | List users                      |
| Users         | `/api/users/[id]`                  | GET        | Get user profile                |
| Users         | `/api/users/[id]/follow`           | POST       | Follow / unfollow               |
| Users         | `/api/users/me`                    | GET        | Current user profile (extended) |
| Notifications | `/api/notifications`               | GET        | List notifications              |
| Notifications | `/api/notifications/mark-all-read` | POST       | Mark all read                   |
| Notifications | `/api/notifications/[id]/read`     | POST       | Mark single read                |
| Uploads       | `/api/uploads/image`               | POST       | Image upload (multipart)        |
| Admin         | `/api/admin/users`                 | GET        | Admin list users                |
| Admin         | `/api/admin/users/[id]/deactivate` | POST       | Deactivate user                 |
| Admin         | `/api/admin/posts`                 | GET        | Admin list posts                |
| Admin         | `/api/admin/posts/[id]`            | DELETE     | Remove post                     |
| Admin         | `/api/admin/comments/[id]`         | DELETE     | Remove comment                  |
| Admin         | `/api/admin/stats`                 | GET        | Platform metrics                |

(Additional validation & RLS assumed via Supabase policies.)

---

## ⚙️ Environment Variables

Create a `.env.local` with at least:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server/admin ops (never expose client side)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

If using Storage buckets or custom email templates, configure them in the Supabase dashboard.

---

## 🚀 Running Locally

```bash
# Install deps
npm install
# Start dev server
npm run dev
# Lint & typecheck
npm run lint
# (Add a build if needed)
npm run build && npm start
```

Visit: http://localhost:3000

---

## 🧩 Supabase Notes

- Uses separate helpers: `supabaseClient.ts` (browser), `supabaseServer.ts` (server components), `supabaseRoute.ts` (route handlers) to ensure the correct auth context.
- RLS policies should enforce row ownership (posts, comments, follows, notifications) & admin overrides via `is_admin` flag.
- Realtime notifications can be enabled by subscribing to changes (future enhancement).

---

## 🛡 Security & Best Practices

- Avoid exposing `SERVICE_ROLE_KEY` client-side.
- Enforce RLS on all tables (Posts, Comments, Follows, Notifications, Profiles, Likes).
- Rate limiting (future) recommended on auth + write endpoints.
- Image uploads: validate MIME & size (enhance route for production hardening).

---

## 🧱 UI Components

Key custom components:

- `follow-button` – follow/unfollow state machine
- `notification-bell` + `notification-center` – unread badge + list
- `post-interactions` – like & comment quick actions
- `logout-form` / `logout-button` – accessible logout with spinner
- Shadcn base components: `button`, `card`, `dropdown-menu`, `avatar`

---

## 📈 Roadmap

| Status | Item                                          |
| ------ | --------------------------------------------- |
| ✅     | Core auth & profiles                          |
| ✅     | Posts, likes, comments                        |
| ✅     | Follows & counts                              |
| ✅     | Notifications (basic)                         |
| ✅     | Admin dashboard                               |
| ✅     | Image uploads                                 |
| 🔜     | Post editing & deletion in UI                 |
| 🔜     | Search (users / posts / hashtags)             |
| 🔜     | Realtime streaming of feed & notifications    |
| 🔜     | Theme switcher (dark / light already partial) |
| 🔜     | Accessibility audits & tests                  |
| 🔜     | Integration tests (Playwright)                |

---

## 🧪 Testing (Planned)

Add scripts:

```bash
# Example (to be implemented)
npm run test
yarn test
```

Consider Vitest + Testing Library + Playwright for E2E.

---

## 🤝 Contributing

1. Fork & clone
2. Create feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional messages
4. Open PR with description & screenshots

---
