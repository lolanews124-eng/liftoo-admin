# Liftoo Admin Panel

Web admin dashboard for managing users, bookings, KYC, categories, payments, and more.

## Prerequisites

- Backend API running at `http://localhost:3000`
- Node.js 18+

## Start

```powershell
cd admin
npm install
npm run dev
```

Open http://localhost:5173

## Default login

- **Email:** admin@liftoo.in
- **Password:** admin123

Run backend seed first: `cd backend && npx prisma db push && npm run prisma:seed`

## Features

- Dashboard with stats
- Users (search, suspend)
- KYC verification queue (approve/reject documents)
- Bookings (filter, view detail, update status)
- Categories & cities CRUD
- Payments, earnings, reviews, referrals
