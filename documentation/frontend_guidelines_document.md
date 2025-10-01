# Frontend Guidelines Document

# Frontend Guideline Document

This document explains, in simple everyday language, how the frontend of our fitness tracker chatbot and dashboard is built and organized. It covers the architecture, design principles, styling, component structure, state management, routing, performance tweaks, testing, and a quick wrap-up.

## 1. Frontend Architecture

**What we use:**
- **Next.js 15** (React framework with App Router)  
- **TypeScript** (for safer, self-documenting code)  
- **Tailwind CSS** (utility-first styling)  
- **shadcn/ui** (prebuilt, themeable UI components)  
- **ai-sdk** (chat parsing and AI plan generation)  
- **Clerk.js** (authentication provider)

**How it all fits together:**
- **App Router & Server Components:** Pages live under `src/app/`. Next.js automatically handles routing and splits code per page. We mix server-side rendering (fast initial load) with client components (interactive chat, theme toggle).  
- **API Routes:** Chat messages go to `app/api/chat/route.ts`, where ai-sdk extracts data and we write to Supabase.  
- **Providers & Context:** At the top level, we wrap our app in Clerk’s `<ClerkProvider>` for auth and a custom `<ThemeProvider>` for light/dark mode.  

**Why this works for us:**  
- **Scalability:** Code splitting and serverless functions mean we only load what we need. Adding new pages or features is as simple as dropping in a new folder under `app/`.  
- **Maintainability:** TypeScript plus clear folder conventions keep things predictable. Prebuilt shadcn components reduce duplication.  
- **Performance:** Next.js handles SSR and streaming, Tailwind purges unused CSS, and images use `next/image` for on-the-fly optimization.

## 2. Design Principles

1. **Usability**  
   - Chat-first interface: No confusing forms—just natural language.  
   - Clean dashboard: Clear charts and tables, quick buttons for key actions.  
2. **Accessibility**  
   - Semantic HTML and ARIA labels on interactive elements.  
   - Keyboard navigation and focus outlines on buttons and inputs.  
   - Color contrast meets WCAG AA (especially around our red accent).  
3. **Responsiveness**  
   - Mobile-first Tailwind breakpoints ensure layouts stack or shrink gracefully.  
   - Dark mode toggle for low-light comfort.  
4. **Consistency**  
   - One red accent color for primary actions, consistent padding and typography.  
   - Shared design tokens via Tailwind config keep spacing, colors, and fonts unified.

**How we apply these:** Chat bubbles and buttons use clear labels (“Log Weight”, “Generate Plan”). Charts use tooltips and high-contrast lines. All interactive elements give visual feedback on hover, focus, and disabled states.

## 3. Styling and Theming

### 3.1 Styling Approach
- **Tailwind CSS** with utility classes for margins, padding, colors, and typography.  
- Customizations done in `tailwind.config.ts` (colors, breakpoints, fonts).  
- Global styles (dark mode toggles, body backgrounds) in `globals.css`.

### 3.2 Theming
- **Light & Dark Mode:** CSS variables switch background, text, and card colors.  
- `<ThemeProvider>` uses React Context to persist user preference (in local storage + database).  
- shadcn/ui components adapt automatically to the current theme.

### 3.3 Visual Style
- **Design Style:** Flat and modern with subtle shadows for depth. Minimalist layout keeps focus on chat and data.  
- **Glassmorphism?** No—stick to solid backgrounds and clear panels for readability.

### 3.4 Color Palette
- **Primary Red:** #DC2626  
- **Secondary Gray (light):** #F3F4F6  
- **Secondary Gray (dark):** #1F2937  
- **Accent Blue:** #3B82F6 (for links or secondary buttons)  
- **Success (green):** #16A34A  
- **Warning (yellow):** #F59E0B  
- **Error (red):** #B91C1C  

### 3.5 Typography
- **Font Family:** Inter, sans-serif  
- **Headings:** 600 weight, sizes from 1.25rem (h3) to 2rem (h1)  
- **Body Text:** 400 weight, 1rem base size  
- **Code / Monospaced:** Menlo or SFMono for small snippets

## 4. Component Structure

**Folder Layout:**
```
src/
 ├─ app/                  # Next.js App Router pages and layouts
 ├─ components/
 |    ├─ ui/              # shadcn/ui overrides and wrappers
 |    ├─ chat/            # Chat interface components (bubbles, input, history)
 |    └─ dashboard/       # Charts, tables, plan cards, filters
 ├─ lib/                  # Utilities (api clients, env checks)
 └─ hooks/                # Custom React hooks (useTheme, useChat)
```

**Key Points:**
- **Atomic & Feature-Based:** UI primitives live in `components/ui/`. Feature components live in their own subfolders.  
- **Reusability:** Button, Modal, Avatar, Chart wrappers get imported wherever needed—no copy/paste.  
- **Separation of Concerns:** Chat UI only cares about presentation; data fetching lives in hooks or server components.

## 5. State Management

**What we manage:** chat messages, user info, theme, fetched dashboard data.

- **Auth & Session:** Clerk’s `<ClerkProvider>` exposes `useUser()` everywhere to get the logged-in user.  
- **Theme:** React Context in `ThemeProvider` with `useTheme()` hook.  
- **Chat State:** Local React state (`useState`) inside Chat component for message list and input.  
- **Persisted Data:** Leverage Next.js server components or client hooks (e.g. `useSWR` or `React Query`) to fetch weights, workouts, meals, and plans from our API routes.  
- **Supabase Real-Time:** Optionally subscribe to live updates on weight or plan tables if we push for live collaboration later.

**Why not Redux?** Our data needs are modest and fit well with server components plus React Context/hooks. We avoid extra boilerplate.

## 6. Routing and Navigation

- **Next.js App Router:** Files under `src/app/` map to routes automatically:
  - `/chat` → chat interface  
  - `/dashboard` → data visualizations  
  - `/settings` → profile and preferences
- **Linking:** Use `<Link href="/dashboard">` or the shadcn `<NavigationMenu>` for client-side transitions without full reloads.  
- **Protected Routes:** `middleware.ts` checks Clerk session; unauthenticated visitors get redirected to `/login`.
- **Dynamic Segments:** If we ever support plan detail pages (`/plans/[id]`), Next.js handles dynamic folders seamlessly.

## 7. Performance Optimization

1. **Code Splitting & SSR:** Next.js splits each page’s code bundle and renders critical bits on the server.  
2. **Lazy Loading:** Dynamically import heavy chart libraries or AI result viewers with `next/dynamic`.  
3. **Tailwind Purge:** Unused CSS classes removed in production builds, keeping CSS under ~50KB.  
4. **Next/Image & Next/Font:** Automatic image resizing and font optimization.  
5. **Memoization:** Use `React.memo` for chart wrappers and `useCallback`/`useMemo` for expensive calculations.  
6. **API Caching:** Stale-while-revalidate via `useSWR` or React Query for dashboard data.

## 8. Testing and Quality Assurance

- **Linters & Formatters:** ESLint (with TypeScript rules) and Prettier enforce consistent, error-free code.  
- **Unit Tests:** Jest + React Testing Library for component logic (chat parsing UI, button states).  
- **Integration Tests:** React Testing Library plus mocked Supabase and Clerk contexts to ensure pages render correctly.  
- **End-to-End Tests:** Cypress or Playwright scripts that:
  - Sign up / log in  
  - Log a chat entry and verify it shows up in the dashboard  
  - Generate a plan and confirm it’s saved  
- **CI Pipeline:** GitHub Actions runs lint, unit tests, and e2e tests on every pull request.  
- **Accessibility Checks:** `axe-core` integration in tests to catch contrast or ARIA issues early.

## 9. Conclusion and Overall Frontend Summary

We’ve built a **scalable**, **maintainable**, and **high-performance** frontend using Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui. Our **design principles** ensure the app is easy to use, accessible to everyone, and looks consistent across light and dark modes. With a **component-based structure**, clear **state management** via hooks and context, and **Next.js routing**, feature additions stay straightforward. **Performance optimizations** like code splitting and image resizing keep the UI snappy, while **testing** and **CI** guard against regressions.

Together, these guidelines give any developer a clear roadmap to understand, extend, and maintain our fitness tracker’s frontend—no prior background needed.

---
**Document Details**
- **Project ID**: 2d581913-6f01-4d83-a87d-eb24341aaf30
- **Document ID**: cbc81627-b3f8-4521-96d7-e61323c57938
- **Type**: custom
- **Custom Type**: frontend_guidelines_document
- **Status**: completed
- **Generated On**: 2025-10-01T11:38:50.866Z
- **Last Updated**: N/A
