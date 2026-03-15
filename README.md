# Akshaya Dairy – Backend API

Express + TypeScript + MongoDB (Mongoose).

## Setup

```bash
npm install
cp .env.example .env
# Set MONGODB_URI and JWT_SECRET in .env
npm run seed   # optional: create default admin
npm run dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api-docs  

## Deploy (Vercel)

Use this repo with **Root Directory** empty. Add env: `MONGODB_URI`, `JWT_SECRET`; optional: `ADMIN_APP_URL`, `DRIVER_APP_URL`.
