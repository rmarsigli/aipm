---
number: 005
title: "Remove Non-Functional diff Command"
date: 2026-01-19
status: accepted
authors: [AIPIM Team]
tags: [cli, technical-debt, code-quality]
---

# ADR-005: Remove Non-Functional diff Command

## Status

**Accepted**

Date: 2026-01-19

## Context

**The Problem:**
The `aipim diff` command appeared in CLI help output but was non-functional (stub implementation). This created a poor user experience where advertised functionality didn't work.

**Discovery:**
- `src/commands/diff.ts` existed since commit 069101e (ESM migration)
- Contained only a stub: "TODO: Full implementation requires regenerating prompts..."
- Original intent: "Show what would change with update" (per cli.ts description)
- Never implemented beyond initial stub

**Critical Finding:**
The `update` command ALREADY provides this functionality via `--dry-run` flag:
```bash
# This works today:
aipim update --dry-run

# This was broken:
aipim diff  # Just logged "experimental/stubbed"
```

## Decision

**We will remove the `diff` command completely.**

**Rationale:**
1. **Redundant:** Functionality already exists in `update --dry-run`
2. **Confusing UX:** Advertising broken functionality damages trust
3. **Technical Debt:** Stub code without clear implementation plan
4. **No Demand:** No user requests or issues filed for diff functionality
5. **Maintenance:** One less command to maintain/document

## Alternatives Considered

### Option 1: Implement diff Command

**Pros:**
- Fulfills advertised functionality
- Dedicated command for preview operations

**Cons:**
- Duplicates existing `update --dry-run` functionality
- Estimated 2-3 hours implementation time
- No unique value proposition
- Increased maintenance burden

**Rejected because:** Complete duplication of existing feature with no added value.

### Option 2: Keep Stub, Document as "Coming Soon"

**Pros:**
- Minimal effort (just update help text)
- Keeps option open for future

**Cons:**
- Technical debt remains
- Still confusing to users
- Unclear timeline for implementation

**Rejected because:** Perpetuates poor UX and accumulates technical debt.

## Implementation

**Completed:**
1. [x] Deleted `src/commands/diff.ts`
2. [x] Removed import from `src/cli.ts:8`
3. [x] Removed command registration from `src/cli.ts:90-101`
4. [x] Verified no other references exist (grep verified)
5. [x] Build passed successfully
6. [x] Created this ADR

**Files Modified:**
- Deleted: `src/commands/diff.ts` (10 lines)
- Modified: `src/cli.ts` (removed 2 lines: import + 13 lines: command registration)

## Consequences

### Positive
- [x] CLI help now accurately reflects available commands
- [x] Reduced technical debt (removed stub code)
- [x] Simplified codebase (one less command to maintain)
- [x] Users directed to working solution (`update --dry-run`)

### Negative
- None identified. No users were relying on the broken stub.

### Migration Path
For users who expected diff functionality:
```bash
# Old (broken):
aipim diff

# New (working):
aipim update --dry-run
```

## Validation

**Success Criteria:**
- [x] `aipim --help` no longer shows diff command ✅
- [x] `aipim diff` shows "unknown command" error ✅
- [x] Build completes without errors ✅
- [x] No broken imports or references ✅

**Testing:**
```bash
# Verified clean removal
grep -r "diff" src/ --include="*.ts" | grep -v "different" | grep -v "diffMs" | grep -v "git diff"
# Result: Only legitimate uses (diffMs for time calculations, git diff stat)

# Build verification
pnpm build
# Result: ✅ Build success in 35ms
```

## Related

**Part of:**
- Sprint 1: Critical Fixes (Quality Improvement Roadmap)
- Task T019: diff.ts Decision

**Addresses:**
- Code Quality Analysis Report 2026-01-19 (Technical Debt section)
- Quality Score: 80.6 → 82.0 (estimated +1.4 improvement)

## References

- Task: `.project/backlog/2026-01-19-T019-diff-command-decision.md`
- Quality Roadmap: `.project/docs/quality-improvement-roadmap.md`
- Original stub: commit 069101e

## Approval

**Decided by:** AIPIM Team
**Date:** 2026-01-19
**Status:** ✅ Approved & Implemented

---

**Version:** 1.0
**Last Updated:** 2026-01-19
