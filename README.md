# TripMate — Travel Planning & Voting App

A full-stack travel planning web application that helps groups of friends plan trips together — vote on dates, budget, and destinations, then get an AI-generated trip summary.

> 🔁 **Rebuilt from a group project** — extended with a TypeScript backend, Prisma ORM, PostgreSQL database, and AI-powered trip summary feature.

---

## ✨ What's New (My Additions)

| Feature | Description |
|---|---|
| 🏗 Backend Rebuild | Migrated from plain JavaScript to **TypeScript + Express + Prisma ORM** |
| 🗄 Database Migration | Moved to **PostgreSQL on Supabase** with a fully normalized schema |
| 🔐 JWT Authentication | Built register/login/me endpoints with **bcrypt** password hashing |
| 🤖 AI Trip Summary | Integrated **Claude API** to generate a comprehensive trip plan from vote results |
| 🎨 UI Redesign | Rebuilt frontend UI with **Tailwind CSS + shadcn/ui + Framer Motion** |

---

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- TanStack Query
- Framer Motion

### Backend
- Node.js + Express 5
- TypeScript
- Prisma ORM
- JWT + bcryptjs

### Database
- PostgreSQL (Supabase)

### AI
- Anthropic Claude API (trip summary generation)

### DevOps
- GitHub (version control)
- Render (backend hosting) — *coming soon*
- Vercel (frontend hosting) — *coming soon*

---

## 🚀 Features

- **Trip Management** — create trips, generate invite codes, manage members
- **Date Voting** — members submit available dates, heatmap shows best overlap
- **Budget Voting** — vote on budget per category (accommodation, food, transport, activity)
- **Location Voting** — vote and rank destination options
- **Role System** — owner can approve/reject join requests, remove members
- **AI Trip Summary** — Claude generates a full trip plan based on all vote results
- **Notifications** — get notified on join requests, approvals, and trip status changes

---

## 📁 Project Structure

```
trip-planner/
├── frontend/               # React + Vite + TypeScript
│   └── src/
│       ├── components/     # UI components (trip, vote, layout)
│       ├── pages/          # Route pages
│       ├── services/       # API client + service layer
│       ├── stores/         # Zustand global state
│       ├── hooks/          # Custom React hooks
│       └── types/          # TypeScript types
│
└── backend/                # Express + Prisma + TypeScript
    └── src/
        ├── routes/         # auth, trips, votes, noti
        ├── controllers/    # Business logic
        ├── middleware/      # JWT auth, error handler
        ├── services/       # AI service (Claude)
        └── db/             # Prisma client
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or a free [Supabase](https://supabase.com) project)

### 1. Clone the repository

```bash
git clone https://github.com/Thantawan6509650427/tripmate-travel-planner.git
cd tripmate-travel-planner
git checkout rebuild/fullstack-v2
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
ANTHROPIC_API_KEY="sk-ant-..."   # optional — needed for AI summary
```

Run database migration:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend:

```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🗄 Database Schema

Key models: `User`, `Trip`, `TripMember`, `Availability`, `BudgetVote`, `LocationVote`, `Notification`

```
User ──< TripMember >── Trip
                         │
              ┌──────────┼──────────┐
              │          │          │
         Availability  BudgetVote  LocationVote
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Trips
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trips/all-my-trips` | Get all my trips |
| POST | `/api/trips/add-trip` | Create new trip |
| POST | `/api/trips/request-join` | Join trip by invite code |
| GET | `/api/trips/:tripId` | Get trip detail |
| DELETE | `/api/trips/:tripId` | Delete trip |
| PATCH | `/api/trips/:tripId/approve/:userId` | Approve join request |
| PATCH | `/api/trips/:tripId/reject/:userId` | Reject join request |
| PATCH | `/api/trips/:tripId/manual-close` | Close trip |

### Votes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/votes/availability` | Submit available dates |
| GET | `/api/votes/:tripId/date-matching-result` | Get date heatmap |
| POST | `/api/votes/start-voting` | Start voting phase |
| GET | `/api/votes/:tripId/get-budget` | Get budget votes |
| POST | `/api/votes/:tripId/budget` | Submit budget vote |
| GET | `/api/votes/:tripId/get-vote-place` | Get location votes |
| POST | `/api/votes/:tripId/vote-place` | Submit location vote |

---

## 🌱 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooler) |
| `DIRECT_URL` | ✅ | PostgreSQL direct connection (for Prisma migrate) |
| `JWT_SECRET` | ✅ | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | ✅ | Token expiry e.g. `7d` |
| `PORT` | ✅ | Backend port (default 5000) |
| `CLIENT_URL` | ✅ | Frontend URL for CORS |
| `ANTHROPIC_API_KEY` | ⬜ | Claude API key for AI trip summary |
| `VITE_API_BASE_URL` | ✅ | Backend API URL (frontend) |

---

## 🗺 Roadmap

- [x] Backend rebuild with TypeScript + Prisma
- [x] PostgreSQL database migration (Supabase)
- [x] JWT Authentication
- [x] Trip CRUD + member management
- [x] Date / Budget / Location voting system
- [x] AI Trip Summary (Claude API)
- [ ] UI Redesign with Tailwind + shadcn/ui
- [ ] Deploy to Render + Vercel
- [ ] Realtime notifications

---

## 👤 Author

**Thantawan** — [@Thantawan6509650427](https://github.com/Thantawan6509650427)

> Originally built as a group project with teammates. This branch (`rebuild/fullstack-v2`) is a personal rebuild focused on production-ready architecture, TypeScript migration, and AI integration.

---

## 📄 License

MIT