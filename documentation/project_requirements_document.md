# Project Requirements Document

# Project Requirements Document

## 1. Project Overview

You’re building a web-based fitness tracker chatbot plus dashboard that lets individual users log body measurements, workouts, and meals simply by chatting. Instead of filling out forms, users tell the assistant things like “I weighed 180 lbs” or “Did 4×10 squats at 135 lbs,” and the system extracts, validates, and stores those details. On the dashboard, users see interactive charts and AI-driven insights about weight trends, workout volume, and nutrition. They can also ask the AI for a fresh workout or diet plan tailored to their latest stats.

This tool exists to make fitness tracking frictionless and conversational, eliminating clunky data entry and giving instant feedback. Success means users can log data in natural language, view accurate visualizations of progress, and request new plans—all in under two seconds of chat response time. Security, data privacy, and a red-accented, minimalist design round out the key objectives.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1.0)

*   User sign-up and login (email/password) via Clerk.js

*   Natural-language chat interface powered by ai-sdk

*   Extraction and storage of:

    *   Body weight & body-fat percentage
    *   Workout logs (type, sets, reps, weight)
    *   Meal entries (description, estimated calories)

*   Data storage in Supabase with row-level security (RLS)

*   Dashboard: charts for weight, body fat, workout volume; tables for meals

*   AI-generated workout & diet plans on demand

*   User profile settings (target weight, measurement units, color theme, dark mode)

*   Responsive web design using Next.js 15 + Tailwind CSS + shadcn/ui components

*   Red as the primary accent color

### Out-of-Scope (Planned for Later)

*   Automatic syncing with wearables or external fitness APIs
*   Push notifications, SMS or email reminders
*   Multiple user roles (coaches, admins) or team features
*   Offline mode or mobile‐app deployment
*   In-app purchases or monetization features

## 3. User Flow

When a new visitor arrives, they see a clean homepage with “Sign Up” or “Log In.” After email/password authentication via Clerk.js, the user lands in the chat interface. A friendly assistant message invites them to log today’s stats. The user types entries like “I’m 28% body fat” or “Ran 3 miles in 30 minutes.” The ai-sdk parses each message, confirms back in chat (“Got it—logged 3 miles in 30 minutes”), and stores the data in Supabase under the user’s account.

From the chat screen, a navigation menu (or button) takes the user to the Dashboard. Here, red-accented charts show weight and body-fat trends over time, and workout volume graphs break down sets/reps/week. A “Generate New Plan” button lets the user request a fresh workout or diet regimen; the AI responds in the chat window with day-by-day guidance and saves it for later reference. The user can also adjust settings—like target weight or dark mode—in their Profile section and log out when finished.

## 4. Core Features

*   **User Authentication & Security**\
    • Email/password login via Clerk.js\
    • Supabase row-level security ensures each user sees only their data
*   **Chat-Based Data Entry**\
    • Natural-language input for weight, body fat, workout details, meals\
    • ai-sdk parses, validates, and acknowledges entries in real time
*   **Data Persistence**\
    • Next.js API routes (`app/api/chat/route.ts`) receive structured payloads\
    • Supabase stores logs in tables: `weights`, `body_fat`, `workouts`, `meals`
*   **Interactive Dashboard**\
    • Charts (line, bar) for trends; tables for meal logs\
    • Filters by date range; responsive layout
*   **AI-Generated Plans**\
    • On-demand workout & diet plan creation based on latest stats\
    • Plans saved in Supabase under `plans` table
*   **Profile & Settings**\
    • Update target weight, measurement units (lbs/kg), dietary preferences\
    • Toggle dark mode; select primary accent color (red)

## 5. Tech Stack & Tools

*   **Frontend:**

    *   Next.js 15 (React framework)
    *   TypeScript (typed JavaScript)
    *   Tailwind CSS (utility-first styling)
    *   shadcn/ui (prebuilt React components)

*   **Backend & Database:**

    *   Next.js serverless API routes
    *   Supabase (PostgreSQL + Auth + RLS)

*   **Authentication:**

    *   Clerk.js (user management & sessions)

*   **AI & Chat:**

    *   ai-sdk for natural language understanding and plan generation

*   **Development Tools:**

    *   VS Code or WebStorm IDE
    *   Dev container (Docker) for consistent environment
    *   ESLint, Prettier for code quality

## 6. Non-Functional Requirements

*   **Performance:**

    *   Chat response latency < 2 seconds on average
    *   Dashboard chart rendering < 1 second for 1 year of data

*   **Security & Privacy:**

    *   All API calls authenticated via Clerk JWT tokens
    *   Supabase RLS policies enforce row-level data isolation
    *   TLS everywhere (HTTPS)

*   **Scalability:**

    *   Serverless endpoints auto-scale with user load
    *   Database indexes on timestamp and user_id

*   **Usability:**

    *   Responsive design for desktop and tablets
    *   Dark mode for low-light environments
    *   Consistent red accent color for primary actions

## 7. Constraints & Assumptions

*   **Constraints:**

    *   Must use ai-sdk for all NLP and plan generation
    *   Reliant on Supabase hosting availability and Clerk service uptime
    *   No external device integrations (e.g., wearables)

*   **Assumptions:**

    *   Users will manually input all data via chat
    *   Users have modern browsers with JS enabled
    *   Primary audience is an individual fitness enthusiast

## 8. Known Issues & Potential Pitfalls

*   **Ambiguous Chat Inputs:**

    *   Users may enter unclear messages (“I ran fast today”).
    *   *Mitigation:* Add fallback prompts asking for specifics (distance, duration).

*   **API Rate Limits or Outages:**

    *   ai-sdk or Clerk may throttle or go down.
    *   *Mitigation:* Graceful error messages in chat; retry logic with exponential back-off.

*   **Supabase RLS Misconfiguration:**

    *   Users might see others’ data if policies are wrong.
    *   *Mitigation:* Write unit tests for RLS and verify with automated CI checks.

*   **Large Data Volume on Dashboard:**

    *   Rendering hundreds of data points could lag.
    *   *Mitigation:* Implement pagination or data down-sampling for charts.

*   **Theme Inconsistencies:**

    *   Mixing default Tailwind colors with red accent.
    *   *Mitigation:* Define and enforce a design token for “primary-red” in Tailwind config.

This document provides all details the AI or dev team needs to generate technical specs, frontend/back-end guidelines, file structures, and security policies without ambiguity.


---
**Document Details**
- **Project ID**: 2d581913-6f01-4d83-a87d-eb24341aaf30
- **Document ID**: 0acb0b2c-324f-4789-9403-8a255686e31a
- **Type**: custom
- **Custom Type**: project_requirements_document
- **Status**: completed
- **Generated On**: 2025-10-01T11:36:10.968Z
- **Last Updated**: 2025-10-01T12:49:08.792Z
