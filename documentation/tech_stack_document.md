# Tech Stack Document

# Tech Stack Document

This document explains the technology choices behind the fitness tracker chatbot and dashboard. It’s written in clear, everyday language so anyone can understand why we picked each tool and how they all work together.

## 1. Frontend Technologies

Our frontend is what users interact with directly in their web browsers. Here’s what we use:

- **Next.js 15**
  - A React framework that handles page routing, server-side rendering (SSR), and static site generation (SSG).
  - Gives us fast page loads, automatic code splitting, and built-in API routes for simple backend logic.
- **TypeScript**
  - A version of JavaScript that adds type checking.
  - Helps catch errors early and makes the code easier to understand and maintain.
- **Tailwind CSS**
  - A utility-first CSS framework that allows us to build custom designs quickly without leaving our HTML/JSX.
  - Purges unused styles automatically so the final CSS bundle stays small.
- **shadcn/ui**
  - A library of pre-built, themeable UI components (buttons, forms, modals, charts, etc.) styled with Tailwind.
  - Speeds up development and ensures a consistent, red-accented design throughout the app.
- **Next/Image & Next/Link**
  - Built-in components that optimize images and handle client-side navigation.

How these choices improve the user experience:
- Faster initial load and smooth page transitions thanks to SSR and code splitting.
- Consistent, polished look and feel with minimal custom CSS work.
- Type safety and clear code structure for easier future updates.

## 2. Backend Technologies

The backend powers data processing, storage, and authentication behind the scenes.

- **Next.js API Routes**
  - Serverless functions under `app/api/chat/route.ts` handle chat messages, parse data, and respond in real time.
- **ai-sdk**
  - Our AI integration layer that reads user chat input, extracts fitness data (weight, workouts, meals), and returns structured results.
- **Supabase (PostgreSQL)**
  - A hosted database service that stores user entries: weight logs, workout sessions, meal records, and generated plans.
  - Row-Level Security (RLS) ensures each user sees only their own data.
- **Clerk Auth**
  - Manages user sign-up, login, sessions, and secure tokens.
  - Integrated directly with Next.js and Supabase to protect API routes and database rows.

Together, these components allow chat messages to be processed, validated, saved, and retrieved in real time, all while keeping private data secure.

## 3. Infrastructure and Deployment

This section covers how we host and deploy the application, plus our development setup.

- **Vercel**
  - Our hosting platform for Next.js apps with zero-configuration deployments.
  - Provides automatic SSL/TLS, global CDN, and edge caching for speed and security.
- **GitHub & GitHub Actions**
  - Source control for all code and collaborative work.
  - CI/CD pipelines can run tests and deploy to Vercel on each merge to the main branch.
- **.devcontainer (Docker)**
  - A Docker-based development environment that ensures everyone on the team has the same setup.
- **Environment Variables**
  - Stored securely in Vercel (and locally in `.env.local`) for secrets like database URLs, API keys, and Clerk credentials.

These choices make deployments reliable, recoverable, and scalable as the user base grows.

## 4. Third-Party Integrations

We rely on a few key external services to add functionality without rebuilding everything from scratch:

- **ai-sdk**
  - Provides the natural language understanding behind our chatbot, so you can log data by simply chatting.
- **Supabase**
  - Database, authentication helper, and built-in APIs for real-time updates.
- **Clerk Auth**
  - Secure, drop-in user management with email/password signup and session handling.

These services free us from maintaining complex infrastructure and let us focus on the fitness tracking experience.

## 5. Security and Performance Considerations

We’ve implemented measures to keep user data safe and the app running smoothly:

Security
- All traffic is served over HTTPS (via Vercel’s SSL certificates).
- Clerk provides secure authentication flows and industry-standard password handling.
- Supabase Row-Level Security ensures each user can only access their own records.
- Environment variables and API keys are never committed to source control.

Performance
- Server-side rendering and automatic code splitting in Next.js reduce initial load times.
- Tailwind CSS purge removes unused styles, keeping CSS bundles small.
- Next/Image optimizes images on the fly and serves the right size for each device.
- Vercel’s CDN caches static assets globally for fast content delivery.

## 6. Conclusion and Overall Tech Stack Summary

To recap, this fitness tracker chatbot and dashboard uses a modern, cohesive set of tools that align with our goals of simplicity, performance, and security:

- Frontend: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API Routes, ai-sdk, Supabase (PostgreSQL + RLS), Clerk Auth
- Infrastructure: Vercel hosting, GitHub + GitHub Actions, Docker dev containers
- Integrations: ai-sdk for chat parsing, Supabase for data storage, Clerk for user management

This stack ensures a smooth user experience—users can chat naturally to log workouts and meals, view real-time insights in a responsive dashboard, and trust that their data is secure. At the same time, it keeps our development process efficient, maintainable, and ready to scale.

---
**Document Details**
- **Project ID**: 2d581913-6f01-4d83-a87d-eb24341aaf30
- **Document ID**: 5a8de660-119d-420a-8e85-b0567c93a9a1
- **Type**: custom
- **Custom Type**: tech_stack_document
- **Status**: completed
- **Generated On**: 2025-10-01T11:38:09.814Z
- **Last Updated**: N/A
