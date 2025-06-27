# Self-Order Kiosk Setup Guide

This guide will help you set up and run the self-order kiosk system using React, Vite.js, Tailwind CSS, and Supabase.

## Prerequisites

Before starting, ensure you have:

- [Node.js](https://nodejs.org/) (v18 or higher) and npm installed
- A [Supabase account](https://supabase.io) (free tier works)
- A [PaymongoAccount] (https://paymongo.com) (for e-wallet payment)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.io/dashboard)
2. Click "New Project"
3. Enter project name and password
4. Wait for database to initialize (≈2 minutes)
5. Go to **Settings → API** and copy:
   - `URL` (found under "Project URL")
   - `anon public` key (found under "API Keys")

### 3. Configure Environment Variables

1. Create a `.env` file in your project root
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_PAYMONGO_SECRET_KEY=your_sk_test_key from paymongo.com "developers" section
```

### 4. Database Setup

1. In Supabase dashboard:
   - Go to **SQL Editor**
   - Run all SQL files from `supabase/migrations/` in numerical order
   - copy`schema.sql`, `policies.sql`, `functions.sql`,`bucket.sql`

### 5. Start Development Server

```bash
npm run dev
```
