# Vue 3 / TypeScript Guidelines

## Core Principles
- **API**: Composition API (`<script setup lang="ts">`) exclusively. No Options API.
- **Languages**: TypeScript + Vue 3.4+.
- **Naming**: 
  - Files: `kebab-case` (e.g., `user-profile.vue`).
  - Components (Template): `PascalCase` (e.g., `<UserProfile />`).
  - Composables: `useCamelCase` (e.g., `useAuth`).
- **Semicolons**: **NO SEMICOLONS**. (Strict project rule).

## Project Structure
- `components/`: Dumb UI components.
- `views/` or `pages/`: Route components.
- `composables/`: Shared logic (`use...`).
- `stores/`: Pinia stores.

## Coding Standards
- **Typing**: Use generic `defineProps<{ msg: string }>()` and `defineEmits<{ (e: 'change', id: number): void }>()`.
- **Reactivity**: Prefer `ref()` over `reactive()` for clarity and destructuring safety.
- **Unwrap**: Remember `.value` in script, auto-unwrapped in template.
- **Async**: Use `<Suspense>` or async setup carefully. Prefer `useAsyncState` from VueUse.

## Styling
- **Engine**: Tailwind CSS (Utility-first).
- **Scoped**: Avoid `<style scoped>` if Tailwind can solve it.
- **SFC Order**: `<script setup>`, `<template>`, `<style>`.

## Ecosystem
- **State**: **Pinia** (no Vuex).
- **Router**: Vue Router 4 (typed).
- **Utils**: **VueUse** for common browser APIs / state patterns.
- **Testing**: Vitest + Vue Test Utils.
