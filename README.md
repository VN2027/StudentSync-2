# StudentSync V1

AI-powered study planner for high school students. Upload assessment notifications, get an auto-generated study plan, and track your progress.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a free project at https://supabase.com
2. Go to SQL Editor -> paste the contents of `supabase/schema.sql` -> run it
3. Go to Project Settings -> API and copy your Project URL and anon public key
4. Go to Authentication -> Providers -> Email and (for testing) disable "Confirm email" so signup logs you straight in

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in your Supabase values:
```bash
cp .env.example .env
```

### 4. Run locally
```bash
npm run dev
```

## Deploying to Vercel
1. Push this project to a GitHub repo
2. Import the repo in Vercel
3. In Vercel project settings -> Environment Variables, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
4. Deploy

## What's in V1
- Email/password auth (signup, login, logout, password reset)
- Dashboard: today's tasks, upcoming assessments, streak, completion %
- Add assessment (manual entry, or mock file upload that pre-fills a form)
- Auto-generated study plan (simple stage-based breakdown, saved as tasks)
- Weekly planner with checkable tasks
- Focus mode with a 25-minute Pomodoro timer

## Not in V1 yet (intentional)
- Real AI extraction from uploaded PDFs/images (currently mocked)
- AI-generated study plans via OpenAI (currently a fixed template)
- Streak auto-updating logic
- Parent/teacher dashboards, payments
