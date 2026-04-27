# UniConnect Auth Module

Production-style authentication scaffold for UniConnect using:

- Next.js (App Router)
- PostgreSQL
- Prisma ORM
- JWT authentication (HTTP-only cookie)
- Tailwind CSS

## Implemented features

- Student signup only (@siswa.um.edu.my)
- Duplicate email prevention
- Strong password policy
- Login for User and Admin
- Forgot password email flow with one-time, expiring tokens
- Reset password with old-password reuse blocked
- Pre-created admin account via Prisma seed

## Setup

1. Copy environment values:

   cp .env.example .env

2. Install dependencies:

   npm install

3. Run Prisma migration and generate client:

   npm run prisma:migrate -- --name init
   npm run prisma:generate

4. Seed admin account:

   npm run prisma:seed

5. Start development server:

   npm run dev

## Notes

- Password reset email uses SMTP if configured.
- If SMTP is not configured, reset links are logged to server console for local testing.
