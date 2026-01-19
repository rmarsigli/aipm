---
title: "Remove Commented Debug Code"
created: 2026-01-19T02:00:00-03:00
last_updated: 2026-01-19T14:00:00-03:00
priority: P3
estimated_hours: 0.5
actual_hours: 0.25
status: completed
blockers: []
tags: [cleanup, technical-debt, code-quality]
related_files: [src/core/signature.ts, src/core/scanner.ts]
---

# Task: Remove Commented Debug Code (T031)

## Objective

Remove all commented-out debug code (console.log, debug statements, etc) from the codebase.

**Success:**
- [x] No commented debug statements remain
- [x] Code is cleaner and more readable
- [x] Version control history preserves removed code
- [x] No functional changes

## Context

**Why:** Quality report identified commented debug code in `signature.ts` and potentially other files.

**Current problem:**
- Commented debug code clutters codebase
- Confusing for new developers (is it needed?)
- Dead code that serves no purpose
- Git history already preserves old code

**Impact:** Cleaner codebase, better readability, reduced confusion

**Related:** Code Quality Analysis Report 2026-01-19, Technical Debt section (Score: 76/100)

## Implementation

### Phase 1: Find All Commented Debug Code (Est: 0.25h)
- [ ] Search for commented console.log:
  ```bash
  grep -rn "//.*console\.log\|//.*console\.debug" src/
  grep -rn "/\*.*console\.log.*\*/" src/
  ```
- [ ] Search for commented debug statements:
  ```bash
  grep -rn "//.*DEBUG\|//.*FIXME\|//.*TODO.*debug" src/
  ```
- [ ] Document all findings (file, line, purpose)
- [ ] Verify each is actually dead code (not needed)

### Phase 2: Remove Dead Code (Est: 0.25h)
- [ ] Remove each commented debug statement:
  ```typescript
  // BEFORE
  function processFile(content: string) {
    // console.log('DEBUG: processing', content);
    const result = parse(content);
    // console.log('DEBUG: result', result);
    return result;
  }

  // AFTER
  function processFile(content: string) {
    const result = parse(content);
    return result;
  }
  ```
- [ ] Remove entire commented blocks if dead code
- [ ] Keep TODOs/FIXMEs that are actionable (not debug)
- [ ] Run tests after each removal (verify no breaks)

## Definition of Done

### Functionality
- [ ] All functionality unchanged
- [ ] No regressions
- [ ] Tests pass

### Testing
- [ ] All existing tests pass
- [ ] Manual verification of commands

### Code Quality
- [ ] No commented console.log statements
- [ ] No commented debug code
- [ ] Cleaner, more readable code
- [ ] Linting passes
- [ ] **Grep verification:**
  ```bash
  # Should have ZERO results
  grep -rn "//.*console\.log" src/
  grep -rn "//.*DEBUG.*:" src/
  ```

### Documentation
- [ ] Time logged
- [ ] No documentation changes needed

### Git
- [ ] Atomic commits:
  1. Remove commented debug code from signature.ts
  2. Remove commented debug code from other files
- [ ] Convention: `chore: remove commented debug code`
- [ ] No conflicts

## Testing

### Grep Verification
```bash
# Before cleanup - find all commented debug code
grep -rn "//.*console\." src/ | wc -l
# Example: 15 occurrences

# After cleanup - verify none remain
grep -rn "//.*console\." src/ | wc -l
# Should be: 0 occurrences

# Also check block comments
grep -rn "/\*.*console\.log" src/
# Should be empty
```

### Manual Testing
```bash
# Build (ensure no syntax errors)
pnpm build

# Run tests (ensure no breaks)
pnpm test

# Run CLI commands (smoke test)
aipim --help
aipim install --dry-run
```

## Blockers & Risks

**Current:**
- [ ] None (can start immediately)

**Potential:**
1. Risk: Removing code that's actually needed - Mitigation: Verify each line, test after removal
2. Risk: Commented code might be TODO for feature - Mitigation: Convert to proper TODO comment if needed

## Progress

### Time Log
| Date | Hours | Activity |
|------|-------|----------|
| | 0 | Not started |

**Total:** 0h / 0.5h

## Technical Notes

**What to remove:**
- ✅ Commented console.log (debug output)
- ✅ Commented console.debug
- ✅ Commented console.error (if truly unused)
- ✅ Block comments with old debugging code
- ✅ Temporary debug variables commented out

**What to keep:**
- ❌ Commented explanations (why code works certain way)
- ❌ Actionable TODOs (proper format: `// TODO: implement X`)
- ❌ Commented examples in JSDoc
- ❌ Disabled code that's planned for re-enabling (with TODO)

**Decision criteria:**
```typescript
// REMOVE - pure debug
// console.log('x:', x);

// REMOVE - old debugging block
// if (DEBUG) {
//   console.log('debug info');
// }

// KEEP - explanation
// Use SHA256 instead of MD5 for security

// KEEP - actionable TODO
// TODO: Add caching here for performance

// KEEP - example in comment
// Example: processFile('content') => { parsed: true }
```

**Before removing, ask:**
1. Is this pure debugging code? → Remove
2. Is this a TODO for later? → Convert to proper TODO format
3. Is this an explanation? → Keep or improve
4. Is this dead feature code? → Remove (git preserves history)

## References

- Code Quality Analysis Report: `.project/reports/code-quality-analysis-2026-01-19.md`
- Technical Debt section
- Clean Code: https://www.oreilly.com/library/view/clean-code-a/9780136083238/
- Git history: Use `git log` to see removed code if needed

## Retrospective (Post-completion)

**Went well:**
-

**Improve:**
-

**Estimate:**
- Est: 0.5h, Actual: ___h, Diff: ___%

**Lessons:**
1.

**Cleanup summary:**
- Commented debug lines before: ___
- Commented debug lines after: 0
- Files cleaned: ___

## Completion

- [ ] All DoD checked
- [ ] Time logged
- [ ] Retrospective done
- [ ] Context updated
- [ ] Git merged/ready
- [ ] Validation passed
- [ ] Grep verification passed (zero results)

**Completed:** ___________
**Final time:** _____ hours
