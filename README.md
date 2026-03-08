# Antillia Assurance Group — CRM

Caribbean Property & Catastrophe Insurance Platform

## Quick Deploy

### 1. Supabase Setup
1. Create a project at https://app.supabase.com
2. SQL Editor → run `supabase-schema.sql` → then run `supabase-seed.sql`
3. Authentication → Users → Add User (your email + password)
4. Settings → API → copy Project URL and anon key

### 2. Add Environment Variables
Create `.env.local` in this folder:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy to Vercel
```bash
npm install -g vercel   # if not already installed
vercel                  # first time — follow prompts, add env vars
vercel --prod           # subsequent deploys
```

Or push to GitHub and connect to Vercel dashboard.

## Modules
- `/dashboard` — Executive Risk Command Center
- `/policies` — Policy Lifecycle Management  
- `/clients` — Client & Relationship Management
- `/claims` — Claims Management (FNOL → Settlement)
- `/brokers` — Broker & Commission Tracking
- `/reinsurance` — Reinsurance Treaty Dashboard
- `/risk-intelligence` — Hurricane Exposure Intelligence Engine
- `/fraud` — Fraud Detection Intelligence Layer
- `/reports` — Reports & Regulatory Compliance
