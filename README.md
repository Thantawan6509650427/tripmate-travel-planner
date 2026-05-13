# TripMate Travel Planner

TripMate is a collaborative travel planning web application for groups. Users can create a trip, invite friends, vote on available dates, set budget ranges, vote for destinations, and generate an AI-assisted trip summary with explainable recommendations.

## Highlights

- Personalized Travel Recommender System: recommends places from trip votes, budget fit, group preferences, and destination metadata.
- Route / Itinerary Optimization: groups recommended places into day-by-day itinerary plans with estimated travel distance, duration, and cost.
- Explainable AI + Evaluation Metrics: every recommendation includes score breakdowns, reasons, group agreement, budget confidence, and date confidence.
- Real-time collaboration: notifications and trip updates use Socket.IO.
- Owner/member workflow: trip owners approve join requests, manage members, close voting, and delete trips.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts, Socket.IO Client
- Backend: Node.js, Express, TypeScript, MySQL/TiDB, Socket.IO
- AI integrations: Google Gemini, OpenAI, Anthropic SDK support
- Tooling: npm, Vitest, TypeScript

## Main Features

- Authentication with JWT and Google OAuth support
- Create, join, and manage trips by invite code
- Join request approval/rejection workflow
- Date voting with matching analysis
- Budget voting by category: accommodation, transport, food, and reserve budget
- One-day trips do not require accommodation budget
- Location voting and destination ranking
- AI trip summary and prompt-based plan generation
- Personalized recommendations with explainable scoring
- Optimized itinerary preview
- User-facing modal/toast errors instead of browser alerts

## Project Structure

```text
tripmate-travel-planner/
├─ backend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ services/
│  │  └─ socket/
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ contexts/
│  │  ├─ pages/
│  │  ├─ services/
│  │  └─ types/
│  └─ package.json
└─ package.json
```

## Getting Started

Install dependencies:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
FRONTEND_BASE_URL=http://localhost:5173

DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=4000

ACCESS_SECRET=your-access-secret
REFRESH_SECRET=your-refresh-secret

GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

EMAIL_USER=your-email
EMAIL_PASS=your-email-password
```

Run frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Useful Scripts

```bash
npm run build --prefix frontend
npm run build --prefix backend
npm test --prefix backend -- --run
npx tsc --noEmit --project frontend/tsconfig.json
npx tsc --noEmit --project backend/tsconfig.json
```

## Key API Areas

- `GET /api/trips/:tripId/recommendations`: returns personalized recommendations, scoring explanations, evaluation metrics, and optimized itinerary.
- Trip APIs: create trip, join trip, approve/reject requests, remove members, edit descriptions, delete trips.
- Vote APIs: submit date availability, budget votes, location votes, and manual close.
- Notification APIs: fetch notifications, mark as read, mark all as read, delete notifications, and unread count.

## AI Recommendation Logic

TripMate combines several signals:

- Vote score: how strongly a destination matches group voting.
- Preference match: how well the destination category fits the trip context.
- Budget fit: whether estimated cost is suitable for the voted budget.
- Popularity score: fallback quality signal for place ranking.
- Group agreement: how aligned members are on destination choices.
- Budget confidence: how complete and consistent the budget data is.
- Date confidence: how complete the date voting data is.

The final score is normalized to `0-100` so users can compare recommended places quickly.

## QA Notes

The UI avoids native browser `alert()` and `confirm()` dialogs. User-visible backend or validation failures should be shown through app dialogs, inline error boxes, or toast notifications depending on context.

Recommended checks before submitting:

```bash
rg -n "alert\(|confirm\(" frontend/src
npx tsc --noEmit --project frontend/tsconfig.json
npm run build --prefix frontend
npm test --prefix backend -- --run
```

## Future Improvements

- Connect recommendation data to a richer real destination catalog.
- Add map-based route optimization with real travel times.
- Add weather and seasonal suitability signals.
- Add a user preference profile for food, activities, travel style, and accessibility.
- Export final itinerary to PDF or shareable document.

