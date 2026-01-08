# Node.js / TypeScript Guidelines

## Core Principles
- **Type Safety**: Use TypeScript for everything. Avoid `any` types; use `unknown` with type narrowing if flexible types are needed.
- **Modern ES**: Use ESM (`import`/`export`) syntax. Avoid `require()`.
- **Async/Await**: Use `async`/`await` over raw Promises or callbacks.

## Project Structure
- `src/`: Source code.
- `dist/` or `build/`: Compiled output.
- `tests/`: Unit and integration tests.

## Coding Standards
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces.
- **Error Handling**: Use `try/catch` blocks. Throw `Error` objects, not strings.
- **Environment**: Use `process.env` (typed) for configuration.

## Testing
- Use **Jest** or **Vitest**.
- Write clear descriptions: `it('should return user data', ...)`

## Dependencies
- Use small, focused libraries (avoid bloat).
- Lock versions in `package.json` (exact versions or rigid ranges).
