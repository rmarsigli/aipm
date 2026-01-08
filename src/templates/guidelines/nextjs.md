# Next.js / React Guidelines (App Router)

## Core Principles
- **Languages**: TypeScript + React 19 (Server Components).
- **Naming**: 
  - Files: `kebab-case` (e.g., `user-profile.tsx`).
  - Components: `PascalCase`.
  - Functions: `camelCase`.
- **Semicolons**: **NO SEMICOLONS**. (Strict project rule).

## Project Structure (App Router)
- `app/`: Routes and Layouts using reserved filenames (`page.tsx`, `layout.tsx`).
- `components/`: Reusable UI components.
- `lib/` or `utils/`: Helpers and business logic.
- `styles/`: Global CSS/Tailwind configuration.

## Coding Standards
- **Server First**: Components are Server Components by default. Add `'use client'` only for interactivity (hooks, event listeners).
- **Data Fetching**: Use `await fetch()` in Server Components. Avoid `useEffect` for data fetching.
- **Mutations**: Use **Server Actions** (`'use server'`) for form submissions and side effects.
- **State**: Use URL search params for state where possible (sharable URLs). Use `useQuery` or Context for complex client state.

## Styling
- **Tailwind CSS**: Primary styling engine. utility-first.
- **Class Sorting**: Use `prettier-plugin-tailwindcss` to enforce class order.
- **Responsive**: Mobile-first approach (`<div class="block md:flex">`).

## Testing & Performance
- **Images**: Always use `next/image` with explicit width/height or fill.
- **Fonts**: Use `next/font` to optimized loading.
- **SEO**: Use `export const metadata` or `generateMetadata`.

