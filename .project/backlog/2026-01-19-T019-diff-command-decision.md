---
title: "Implement or Remove diff.ts Stub"
created: 2026-01-19T02:00:00-03:00
last_updated: 2026-01-19T02:00:00-03:00
priority: P1-M
estimated_hours: 3
actual_hours: 0
status: backlog
blockers: []
tags: [feature, technical-debt, decision]
related_files: [src/commands/diff.ts, src/cli.ts]
---

# Task: Implement or Remove diff.ts Stub (T019)

## Objective

Decide whether to implement `aipim diff` command or remove it completely. Current stub is non-functional and confuses users.

**Success:**
- [ ] Decision made: implement OR remove
- [ ] If implement: functional `aipim diff` command
- [ ] If remove: no trace of diff command in codebase
- [ ] No dead code or TODOs remain

## Context

**Why:** Quality report flagged `diff.ts` as non-functional stub. Command exists but does nothing.

**Impact:** Users see `aipim diff` in help but get error/nothing when running it. Bad UX.

**User confusion:** Command appears in `aipim --help` but doesn't work.

**Related:** Code Quality Analysis Report 2026-01-19, Technical Debt section

## Implementation

### Phase 1: Discovery & Decision (Est: 1h)
- [ ] Read current diff.ts implementation
- [ ] Check git history: Why was it created?
- [ ] Search codebase for any references to diff command
- [ ] Check if documented anywhere (README, docs)
- [ ] Review project goals: Is diff useful for AIPIM?
- [ ] **Make decision:** Implement OR Remove

**Decision criteria:**
- Does AIPIM need diff functionality?
- What would diff compare? (GEMINI.md vs CLAUDE.md? Task versions? Context snapshots?)
- Is there user demand?
- Effort vs value ratio

### Phase 2A: If IMPLEMENT (Est: 2h)
- [ ] Define exact functionality:
  - [ ] What files to diff?
  - [ ] Output format (unified diff? side-by-side? semantic?)
  - [ ] Use cases: Compare prompts? Compare task versions?
- [ ] Implement core diff logic
- [ ] Add CLI arguments (--files, --format, etc)
- [ ] Write unit tests
- [ ] Update documentation
- [ ] Add to Quick Start Guide

### Phase 2B: If REMOVE (Est: 0.5h)
- [ ] Remove src/commands/diff.ts
- [ ] Remove command registration in src/cli.ts
- [ ] Remove any imports/references
- [ ] Verify `aipim --help` doesn't show diff
- [ ] Update CHANGELOG (removed non-functional command)
- [ ] Grep codebase to ensure clean removal

## Definition of Done

### If IMPLEMENT:
#### Functionality
- [ ] Works as specified
- [ ] Edge cases handled:
  - [ ] Files don't exist
  - [ ] Files identical
  - [ ] Binary files
  - [ ] Large files
- [ ] Useful error messages
- [ ] Help text clear

#### Testing
- [ ] Unit tests for diff logic
- [ ] Integration test for CLI
- [ ] Manual verification with real files
- [ ] Coverage >80%

#### Documentation
- [ ] CLI reference updated
- [ ] README mentions diff command
- [ ] Examples provided
- [ ] ADR documenting diff design

### If REMOVE:
#### Functionality
- [ ] Command no longer in --help
- [ ] Running `aipim diff` shows "unknown command"
- [ ] No broken imports

#### Testing
- [ ] CLI test suite passes
- [ ] No references in tests
- [ ] `pnpm build` succeeds

#### Documentation
- [ ] CHANGELOG notes removal
- [ ] No mentions in docs

### Common:
#### Code Quality
- [ ] TypeScript clean
- [ ] Linting passes
- [ ] No dead code

#### Git
- [ ] Atomic commits
- [ ] Convention: `feat(cli): implement diff command` OR `chore(cli): remove non-functional diff stub`
- [ ] No conflicts

## Testing

### If IMPLEMENT:
```bash
# Test diff functionality
aipim diff --help
aipim diff .project/prompts/CLAUDE.md .project/prompts/GEMINI.md

# Expected: Shows differences in prompt files
```

### If REMOVE:
```bash
# Verify removal
aipim --help | grep diff  # Should be empty
aipim diff  # Should error: "Unknown command"
grep -r "diff" src/  # Only false positives (like "different")
```

## Blockers & Risks

**Current:**
- [ ] Blocked by decision - need to investigate first

**Potential:**
1. Risk: Removing might disappoint users who wanted it - Mitigation: Check if anyone requested it
2. Risk: Implementing might be feature creep - Mitigation: Define minimal viable version
3. Risk: Unclear requirements - Mitigation: Phase 1 discovery must answer "what should it do?"

## Progress

### Time Log
| Date | Hours | Activity |
|------|-------|----------|
| | 0 | Not started |

**Total:** 0h / 3h (or 1.5h if remove)

## Technical Notes

**Discovery questions:**
1. Original intent: What was diff.ts supposed to do?
2. User value: Would anyone actually use `aipim diff`?
3. Alternatives: Are there better tools (git diff, diff3, etc)?
4. AIPIM-specific: What files/data would be useful to diff?

**Possible implementations:**
- **Prompt comparison:** Diff GEMINI.md vs CLAUDE.md (find inconsistencies)
- **Task version diff:** Compare current-task.md vs completed version
- **Context snapshots:** Compare context.md at different points
- **Template diff:** Compare installed templates vs latest

**Lean toward REMOVE if:**
- No clear use case
- Users can use `git diff` or `diff` command
- Effort > value
- Not in original product vision

**Lean toward IMPLEMENT if:**
- AIPIM-specific diff adds unique value
- Users have requested it
- Aligns with project goals (AI context management)
- Can be minimal (1-2 hour implementation)

## References

- Code Quality Analysis Report: `.project/reports/code-quality-analysis-2026-01-19.md`
- Git history of diff.ts
- Issue tracker (check for diff-related requests)

## Retrospective (Post-completion)

**Went well:**
-

**Improve:**
-

**Estimate:**
- Est: 3h, Actual: ___h, Diff: ___%

**Lessons:**
1.

**Decision rationale:**
- [Document why implemented OR removed]

## Completion

- [ ] All DoD checked
- [ ] Time logged
- [ ] Retrospective done
- [ ] Context updated
- [ ] Git merged/ready
- [ ] Validation passed
- [ ] Decision documented (ADR if implement)

**Completed:** ___________
**Final time:** _____ hours
