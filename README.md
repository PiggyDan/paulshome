# Paul's Home Repair

Next.js 14 website for Paul's Home Repair in Ulaanbaatar, Mongolia. It has a service menu, a quote request form, a chat assistant and an admin dashboard.

## Run locally

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD
npm run dev
```

Open http://localhost:3000. The admin dashboard is at http://localhost:3000/admin.

## Booking

Customers pick a day and time in the booking calendar, on the home page or on any service page. A booked time is hidden from everyone else. A booking stays "needs confirming" until Paul calls the customer and confirms it in admin. Cancelling a booking frees the time again.

## Admin

- **Schedule**: upcoming visits grouped by day, with Confirm, Mark done and Cancel.
- **Requests**: everything from the booking calendar and the chatbot, with status filters.
- **Availability**: working days, visit times, days off, and how far ahead people can book.
- **Services**: English and Mongolian text for each service and its page.

Sign in with `ADMIN_PASSWORD`. When running locally without it, the password is `changeme`. On the live site, admin login stays disabled until `ADMIN_PASSWORD` is set.

## Data storage

Services, requests, bookings and availability are kept in one of two places:

- **Locally / on a normal server:** `data/db.json`. It's created automatically and ignored by git.
- **On Vercel:** Upstash Redis, which is used automatically when `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) are set. Vercel's file system is read-only, so without Redis the site still shows pages but can't save bookings.

## Deploy to Vercel

1. Import the GitHub repo in Vercel. The Next.js settings are detected automatically.
2. **Storage → Create Database → Upstash (Redis)**, free plan, and connect it to this project. Vercel adds the env vars for you.
3. **Settings → Environment Variables:** add `ADMIN_PASSWORD`.
4. Redeploy. Every push to `main` deploys automatically.

## Chatbot

`components/ChatBot.tsx` is rule-based. It answers common questions by keyword and collects name, phone and job details as a request. No API key is needed.
