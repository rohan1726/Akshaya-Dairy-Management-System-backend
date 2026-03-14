# Akshaya Dairy – Backend API

Node.js + Express + TypeScript + MongoDB API for Akshaya Dairy Management System.

## Run locally

1. **Prerequisites:** Node.js 18+, MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com)).

2. **Setup**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env`: set `MONGODB_URI` and `JWT_SECRET`.

3. **Install and run**
   ```bash
   npm install
   npm run seed    # optional: creates default admin if no users
   npm run dev
   ```
   - API: http://localhost:3000  
   - Swagger: http://localhost:3000/api-docs  
   - Health: http://localhost:3000/health  

## Deploy to Vercel

1. Import this repo in Vercel (Root Directory: leave empty).
2. **Environment variables** (Settings → Environment Variables):
   - `MONGODB_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – long random string for production
   - (Optional) `ADMIN_APP_URL`, `DRIVER_APP_URL` – for landing page links
3. Deploy. Your API URL is the Vercel deployment URL.

## Default admin (after seed)

- Mobile: `9999999999` (or `ADMIN_MOBILE` from `.env`)
- Password: `admin123` (or `ADMIN_PASSWORD` from `.env`)
