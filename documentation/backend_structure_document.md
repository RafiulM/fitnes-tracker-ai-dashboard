# Backend Structure Document

# Backend Structure Document

This document outlines the backend setup for the fitness tracker chatbot and dashboard. It explains how each piece fits together—using everyday language—so anyone can understand how data flows, how we host and secure the system, and how we keep things running smoothly.

## 1. Backend Architecture

**Overview**
- We use Next.js 15’s serverless API routes as our backend functions. Each route is a small, self-contained piece of code that responds to HTTP requests.
- The core chat logic lives in `app/api/chat/route.ts`. It takes user messages, sends them to the ai-sdk, and handles the structured response.
- Clerk manages user authentication. Every API route checks the Clerk JWT token to confirm who’s calling.
- Supabase (PostgreSQL) stores all fitness data. We apply row-level security (RLS) so each user can only read and write their own records.

**Design Patterns & Frameworks**
- Controller-Service-Repository pattern:  
  • Controller (API route) handles HTTP details.  
  • Service contains business logic (parse chat, generate plans).  
  • Repository deals directly with database queries.
- Modular code organization keeps chat, data-storage, and plan‐generation logic separate, which helps maintenance and testing.

**Scalability & Performance**
- Serverless endpoints automatically scale up when traffic spikes, then scale down when it’s quiet—avoiding idle server costs.
- Database indexes on `user_id` and timestamp fields ensure queries for dashboard charts remain fast even with years of data.
- Static assets and API responses can be cached at the edge (see Infrastructure Components).

## 2. Database Management

**Technology**
- Supabase (hosted PostgreSQL) for structured, relational data.

**Data Storage & Access**
- Each table uses a `user_id` foreign key (tied to Clerk’s `auth.users`) and timestamps for auditability.
- Row-Level Security (RLS) policies enforce that users only see their own rows.
- The Supabase client in Next.js uses environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) to connect securely.

**Best Practices**
- Migrations: We manage table creation and updates via Supabase migration scripts under `supabase/migrations/`.
- Backups: Supabase automatically takes daily backups and supports point-in-time restore.
- Connection Pooling: Supabase’s built-in pooling handles many simultaneous connections from serverless functions.

## 3. Database Schema

Below is our schema in PostgreSQL format, with each table in a human-readable form.

**Tables and Fields**
1. **weights**  
   • `id` (serial primary key)  
   • `user_id` (UUID, references auth.users.id)  
   • `weight` (numeric)  
   • `unit` (text, default 'lbs')  
   • `recorded_at` (timestamp)  
   • `created_at`, `updated_at` (timestamps)

2. **body_fat**  
   • `id`, `user_id`  
   • `percentage` (numeric)  
   • `recorded_at`, `created_at`, `updated_at`

3. **workouts**  
   • `id`, `user_id`  
   • `type` (text)  
   • `sets` (integer), `reps` (integer), `load` (numeric)  
   • `performed_at` (timestamp)  
   • audit timestamps

4. **meals**  
   • `id`, `user_id`  
   • `description` (text)  
   • `calories` (integer)  
   • `eaten_at` (timestamp)  
   • audit timestamps

5. **plans**  
   • `id`, `user_id`  
   • `plan_type` (text: 'workout' or 'diet')  
   • `content` (JSONB) — full plan details  
   • `generated_at` (timestamp)  
   • audit timestamps

**SQL Definition Example**
```sql
create table weights (
  id serial primary key,
  user_id uuid references auth.users(id),
  weight numeric not null,
  unit text not null default 'lbs',
  recorded_at timestamp not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

-- Similar statements for body_fat, workouts, meals, plans

-- Enable row-level security and policy example:
alter table weights enable row level security;
create policy "Allow user to access own weights"
  on weights for all
  using (user_id = auth.uid());
``` 

## 4. API Design and Endpoints

We follow a RESTful approach. Every request must include a valid Clerk JWT in the `Authorization` header.

**1. POST /api/chat**  
Purpose: Receive a chat message, extract data via ai-sdk, save to DB, and return confirmation.  
Inputs: `{ message: string }`  
Outputs: `{ success: boolean, entries: [...] }`

**2. GET /api/weights**  
Purpose: Fetch weight logs for the dashboard.  
Query params: `startDate`, `endDate`  
Outputs: Array of `{ weight, unit, recorded_at }`

**3. GET /api/body-fat**  
Fetch body fat entries similarly.

**4. GET /api/workouts**  
Fetch workout history: `{ type, sets, reps, load, performed_at }`

**5. GET /api/meals**  
Fetch meal logs: `{ description, calories, eaten_at }`

**6. GET /api/plans**  
List previously generated plans.

**7. POST /api/plans/generate**  
Generate a new workout or diet plan on demand.  
Inputs: `{ planType: 'workout'|'diet' }`  
Outputs: Stored plan JSON and chat message content.

**8. GET/PUT /api/profile**  
Manage user preferences (target weight, units, color theme).

## 5. Hosting Solutions

- **Vercel (Next.js)**  
  • Deploys serverless functions and static assets automatically.  
  • Built-in HTTPS, global CDN, and edge caching.
- **Supabase**  
  • Managed PostgreSQL database with auth and RLS.  
  • Hosted in a cloud region close to our user base.
- **Clerk**  
  • Hosted user management service for sign-up, login, and secure tokens.

**Benefits**
- High reliability: Vercel, Supabase, and Clerk each provide 99.9%+ SLAs.
- Scalability: Serverless and managed DB scale without manual intervention.
- Cost-effectiveness: Pay-as-you-go pricing means low costs at small scale.

## 6. Infrastructure Components

- **Load Balancer & Edge Network (Vercel)**  
  Distributes HTTP traffic to serverless functions across multiple regions.
- **Content Delivery Network (Vercel CDN)**  
  Caches static assets (JS, CSS, images) at edge locations for fast delivery.
- **Caching Mechanisms**  
  • Edge caching for API responses that don’t change often (e.g., user settings).  
  • Client-side caching with SWR in Next.js for data-fetching hooks.
- **Environment Variables**  
  Stored securely in Vercel and injected at build/runtime (`.env.local` locally).

## 7. Security Measures

- **Authentication**  
  Clerk issues JWTs. Every API route verifies tokens before proceeding.
- **Authorization**  
  Supabase RLS policies ensure users can only access their own data.
- **Data Encryption**  
  • In transit: TLS (HTTPS) everywhere.  
  • At rest: Supabase encrypts database files and backups.
- **Input Validation & Sanitization**  
  Chat messages are parsed by ai-sdk; all structured data must pass schema checks before database insertion.
- **Secrets Management**  
  API keys and DB credentials never committed to source control; managed via Vercel’s Dashboard.

## 8. Monitoring and Maintenance

- **Monitoring Tools**  
  • Vercel Analytics for deployment health and function latency.  
  • Supabase Logs for database errors and query performance.  
  • Sentry (optional) for serverless function error tracking.
- **Maintenance Practices**  
  • Automated database migrations via Supabase CLI.  
  • Daily backups and point-in-time restores managed by Supabase.  
  • CI pipeline (GitHub Actions) runs linting, testing, and policy checks before deploy.
  
- **Performance Alerts**  
  Thresholds set in Vercel and Supabase to notify the team if response times or error rates exceed acceptable limits.

## 9. Conclusion and Overall Backend Summary

Our backend combines serverless Next.js API routes, Clerk authentication, ai-sdk for natural language processing, and Supabase for secure, scalable data storage. Here’s how it all aligns with our goals:

- **Frictionless chat logging:** Chat messages flow through a dedicated API route to the ai-sdk, then into the database instantly.
- **Real-time dashboard data:** Separate endpoints deliver precise weight, workout, and meal data with minimal latency.
- **On-demand plan generation:** A simple API call spins up an AI-powered plan, stores it, and returns it for both chat and dashboard views.
- **Security & privacy:** Clerk and Supabase RLS work together to keep every user’s data private. HTTPS and encryption protect data in transit and at rest.
- **Scalable & cost-efficient:** Serverless functions auto-scale, and managed services reduce operational overhead.

This setup ensures a dependable, maintainable backend that grows with our users, while keeping the development process clear and straightforward.

---
**Document Details**
- **Project ID**: 2d581913-6f01-4d83-a87d-eb24341aaf30
- **Document ID**: 72716043-5058-4598-808c-108a8d495b1e
- **Type**: custom
- **Custom Type**: backend_structure_document
- **Status**: completed
- **Generated On**: 2025-10-01T11:38:58.956Z
- **Last Updated**: N/A
