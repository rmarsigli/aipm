---
title: "Split Long Functions into Composable Units"
created: 2026-01-19T02:00:00-03:00
last_updated: 2026-01-19T11:45:00-03:00
priority: P2-M
estimated_hours: 2
actual_hours: 0.5
status: completed
blockers: []
tags: [refactor, code-quality, readability]
related_files: [src/commands/resume.ts]
---

# Task: Split Long Functions into Composable Units (T026)

## Objective

Refactor long functions (especially `generateResumeSummary()` in resume.ts) into smaller, composable, testable functions.

**Success:**
- [ ] No function exceeds 50 lines (guideline, not strict)
- [ ] Each function has single responsibility
- [ ] Functions are composable and reusable
- [ ] Improved readability and testability
- [ ] All tests pass

## Context

**Why:** Quality report identified long functions that are hard to read, test, and maintain.

**Current problem:**
- `generateResumeSummary()` is very long
- Multiple responsibilities in one function
- Hard to test individual parts
- Difficult to understand flow

**Impact:** Better readability, easier testing, improved maintainability

**Related:** Code Quality Analysis Report 2026-01-19, Code Quality & Readability section (Score: 85/100)

## Implementation

### Phase 1: Identify Long Functions (Est: 0.5h)
- [x] Scan codebase for functions >50 lines:
  ```bash
  # Custom script or manual inspection
  find src/ -name "*.ts" -exec wc -l {} \; | sort -rn
  ```
- [x] Read `generateResumeSummary()` in resume.ts
- [x] Document function responsibilities:
  - Parse task data
  - Calculate progress
  - Format session age
  - Extract checkboxes
  - Generate summary text
  - etc.
- [x] Identify other long functions (if any)

### Phase 2: Refactor generateResumeSummary (Est: 1h)
- [x] Break into smaller functions:
  ```typescript
  // BEFORE (1 long function)
  function generateResumeSummary(task, context) {
    // 100+ lines of mixed logic
  }

  // AFTER (multiple small functions)
  function calculateProgress(checkboxes: Checkbox[]): number {
    const total = checkboxes.length;
    const completed = checkboxes.filter(cb => cb.checked).length;
    return Math.round((completed / total) * 100);
  }

  function formatSessionAge(lastUpdated: string): string {
    const now = Date.now();
    const updated = new Date(lastUpdated).getTime();
    const hoursDiff = (now - updated) / (1000 * 60 * 60);

    if (hoursDiff < 2) return '🟢 Fresh';
    if (hoursDiff < 168) return '🟡 Recent';
    return '🔴 Old';
  }

  function extractRecentCheckboxes(
    checkboxes: Checkbox[],
    current: number,
    count = 5
  ): string[] {
    // Logic to get last 3 completed + current + next
  }

  function formatSummaryOutput(data: SummaryData): string {
    // Compose final output string
  }

  // Main function becomes simple composition
  function generateResumeSummary(task, context): string {
    const checkboxes = extractCheckpoints(task.content);
    const progress = calculateProgress(checkboxes);
    const age = formatSessionAge(context.last_updated);
    const recentItems = extractRecentCheckboxes(checkboxes, current);

    return formatSummaryOutput({
      title: task.title,
      progress,
      age,
      recentItems,
      nextAction: context.next_action,
    });
  }
  ```
- [x] Extract each responsibility to named function
- [x] Add TypeScript types to all functions
- [x] Keep main function as thin orchestrator

### Phase 3: Testing (Est: 0.5h)
- [x] Write unit tests for each extracted function:
  ```typescript
  describe('calculateProgress', () => {
    test('returns 0 for no completed', () => {
      const checkboxes = [
        { checked: false, text: 'A' },
        { checked: false, text: 'B' },
      ];
      expect(calculateProgress(checkboxes)).toBe(0);
    });

    test('returns 100 for all completed', () => {
      const checkboxes = [
        { checked: true, text: 'A' },
        { checked: true, text: 'B' },
      ];
      expect(calculateProgress(checkboxes)).toBe(100);
    });

    test('returns 50 for half completed', () => {
      const checkboxes = [
        { checked: true, text: 'A' },
        { checked: false, text: 'B' },
      ];
      expect(calculateProgress(checkboxes)).toBe(50);
    });
  });

  describe('formatSessionAge', () => {
    test('returns Fresh for <2 hours', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      expect(formatSessionAge(oneHourAgo.toISOString())).toBe('🟢 Fresh');
    });

    test('returns Recent for <7 days', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatSessionAge(threeDaysAgo.toISOString())).toBe('🟡 Recent');
    });
  });
  ```
- [x] Test each function in isolation
- [x] Test main function (integration)
- [x] Run existing tests (should pass)

## Definition of Done

### Functionality
- [x] All functionality unchanged
- [x] No regressions
- [x] Output identical to before

### Testing
- [x] Unit tests for extracted functions
- [x] Integration test for main function
- [x] All existing tests pass
- [x] Coverage improved (easier to test small functions)

### Performance
- [x] No performance degradation
- [x] Function call overhead negligible

### Security
- [x] No security implications

### Code Quality
- [x] Functions <50 lines each
- [x] Single responsibility per function
- [x] Clear, descriptive names
- [x] TypeScript types on all functions
- [x] JSDoc on public/exported functions
- [x] Linting passes
- [x] **Readability improved** (subjective but important)

### Documentation
- [x] Time logged
- [x] JSDoc on extracted functions
- [x] No README changes needed

### Git
- [x] Atomic commits:
  1. Extract helper functions
  2. Refactor main function to use helpers
  3. Add unit tests for helpers
- [x] Convention: `refactor(commands): split long functions into composable units`
- [x] No conflicts

## Testing

### Before/After Comparison
```typescript
// BEFORE: Hard to test, understand, maintain
function generateResumeSummary(task, context) {
  // Line 1-20: Parse task
  // Line 21-40: Calculate progress
  // Line 41-60: Format age
  // Line 61-80: Extract checkboxes
  // Line 81-100: Format output
  // Total: 100 lines, multiple responsibilities
}

// AFTER: Easy to test, understand, reuse
function generateResumeSummary(task, context) {
  const data = {
    progress: calculateProgress(task.checkboxes),
    age: formatSessionAge(context.last_updated),
    recent: extractRecentCheckboxes(task.checkboxes),
  };
  return formatSummaryOutput(data);
  // Total: 7 lines, single responsibility (orchestration)
}

// Each helper: 10-20 lines, single responsibility, fully tested
```

### Manual
```bash
# Build and test
pnpm build

# Run resume command
aipim resume

# Output should be IDENTICAL to before refactor
# Verify:
# - Session age displayed correctly
# - Progress percentage correct
# - Checkboxes shown correctly
# - No errors
```

## Blockers & Risks

**Current:**
- [ ] None (can start after T018 investigates truncation issue)

**Potential:**
1. Risk: Breaking functionality during refactor - Mitigation: Test after each extraction
2. Risk: Over-engineering (too many tiny functions) - Mitigation: Balance - aim for clarity
3. Risk: Performance overhead from function calls - Mitigation: Benchmark (likely negligible)

## Progress

### Time Log
| Date | Hours | Activity |
|------|-------|----------|
| | 0 | Not started |

**Total:** 0h / 2h

## Technical Notes

**Function size guidelines:**
- **Ideal:** 10-30 lines
- **Acceptable:** 30-50 lines
- **Refactor:** >50 lines
- **Red flag:** >100 lines

**Single Responsibility Principle (SRP):**
Each function should do ONE thing well:
- ✅ `calculateProgress()` - computes percentage
- ✅ `formatSessionAge()` - formats time difference
- ❌ `doEverything()` - calculates, formats, validates, logs, etc.

**Benefits of small functions:**
1. **Testability:** Easy to test in isolation
2. **Reusability:** Can use in other contexts
3. **Readability:** Clear purpose, easy to understand
4. **Maintainability:** Changes isolated to one function
5. **Debugging:** Smaller surface area for bugs

**When NOT to extract:**
- Function is already clear and simple
- Extraction creates artificial coupling
- Would require too many parameters (>4)
- Logic is inherently sequential and interdependent

## References

- Code Quality Analysis Report: `.project/reports/code-quality-analysis-2026-01-19.md`
- Code Quality & Readability section (recommendation #2)
- Clean Code principles: https://www.oreilly.com/library/view/clean-code-a/9780136083238/
- Single Responsibility Principle: https://en.wikipedia.org/wiki/Single-responsibility_principle

## Retrospective (Post-completion)

**Went well:**
-

**Improve:**
-

**Estimate:**
- Est: 2h, Actual: ___h, Diff: ___%

**Lessons:**
1.

**Refactoring summary:**
- Functions before: ___ (avg ___ lines)
- Functions after: ___ (avg ___ lines)
- Coverage improvement: ___% → ___%

## Completion

- [ ] All DoD checked
- [ ] Time logged
- [ ] Retrospective done
- [ ] Context updated
- [ ] Git merged/ready
- [ ] Validation passed
- [ ] Manual testing confirms identical behavior

**Completed:** ___________
**Final time:** _____ hours
