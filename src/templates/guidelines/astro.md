# Astro / TypeScript Guidelines

## Core Principles
- **Architecture**: Islands Architecture (Partial Hydration). Ship zero JS by default.
- **Languages**: TypeScript + Astro. (React/Vue/Svelte for Islands).
- **Naming**: 
  - Files: `kebab-case` (e.g., `hero-section.astro`).
  - Components: `PascalCase` (e.g., `<HeroSection />`).
- **Semicolons**: **NO SEMICOLONS**. (Strict project rule).

## Project Structure
- `src/pages/`: File-based routing.
- `src/components/`: UI components.
- `src/layouts/`: Page wrappers (`<Layout>`).
- `src/content/`: Content Collections schemas (`config.ts`).

## Coding Standards
- **Typing**: Define `interface Props` and use `const { title } = Astro.props`.
- **Imports**: Use `import type` for types.
- **Frontmatter**: Use strict fences `---` at the top. Top-level await is allowed here.
- **Global**: `Astro.glob` is deprecated; use `import.meta.glob` or Content Collections.

## Styling
- **Engine**: Tailwind CSS (Utility-first).
- **Scope**: Avoid `<style>` tags. Use Tailwind classes.
- **Assets**: Use `astro:assets` and `<Image />` component.

## Best Practices
- **Content Collections**: ALWAYS use Content Collections for markdown/data. Type-safe content access.
- **Hydration**: Use `client:idle` or `client:visible` for interactive components. Avoid `client:load` unless necessary (e.g. Hero LCP).
- **View Transitions**: Use `<ViewTransitions />` for SPA-like navigation.
- **Middleware**: Use `middleware.ts` for edge logic (auth, i18n).