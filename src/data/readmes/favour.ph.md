# Favour.ph

Home services booking marketplace — Philippines.

## Team
| Role | Person | GitHub |
|---|---|---|
| Frontend | Nathan | @natadecua |
| Backend | James | @jamesejercito |
| PM / Full Stack | Milo | @[miloperezes] |

## Stack
- **Frontend:** Next.js 14, Tailwind CSS, Supabase Auth
- **Backend:** [James to fill — Node/Express or similar]
- **Database:** PostgreSQL (Supabase)
- **Notifications:** Semaphore PH (SMS), Nodemailer (email)

## Local Setup
### Client
cd client && npm install && npm run dev

### Server
cd server && npm install && npm run dev

## Branch Strategy
- `main` — production
- `dev` — integration, all PRs go here first
- `feature/*` — individual work

## Commit Convention
feat: add provider profile page
fix: correct booking status update
chore: update dependencies
docs: update README