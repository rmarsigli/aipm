# Feature-First Documentation Pattern

> **Goal:** Reduce AI context consumption by 99% while improving requirement clarity.

This pattern suggests documenting the **business logic** of complex features in a dedicated markdown file *before* implementation.

## The Problem

When asking an AI/Agent to implement a feature in an existing codebase, you typically have two bad options:

1.  **Load everything:** "Here is my entire `src/` folder, add a refund feature."
    -   **Cost:** 100k+ tokens.
    -   **Risk:** AI gets lost in implementation details, misses business rules.
2.  **Load nothing:** "Add a refund feature."
    -   **Cost:** Low tokens.
    -   **Risk:** Hallucination, disconnected code, wrong business logic.

## The Solution: Middle-Ground Context

Create a lightweight "Feature Document" that contains PURE business logic, user stories, and rules, but NO code implementation details.

### Structure

Location: `.project/docs/features/{feature-name}.md`

```markdown
# Feature: Automated Refunds

## Objective
Allow admins to refund transactions < 30 days old without approval.

## Business Rules
1. Transactions > 30 days require Manager approval.
2. Refund amount cannot exceed original transaction value.
3. Must send email notification to user.
4. Must log IP address of admin.

## Edge Cases
- Partial refunds already processed?
- User account deleted?
```

### Workflow

1.  **Write Docs:** Create `docs/features/refunds.md` (approx 2kb).
2.  **Start Task:** "Implement the Refund feature based on `docs/features/refunds.md`."
3.  **Efficiency:** The AI understands the *exact* requirements without reading 500 code files. It only needs to load the specific files it decides to edit.

## Token Savings Example

| Approach | Context Loaded | Size | Tokens | Cost |
|----------|----------------|------|--------|------|
| Code-First | `src/payment/**/*.ts` | 480kb | ~120k | $$$ |
| **Feature-First** | `docs/features/pay.md` | **2kb** | **~500** | **$** |

**Savings:** ~99.6% reduction in context overhead.
