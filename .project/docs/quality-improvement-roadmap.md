# Quality Improvement Roadmap

**Based on:** Code Quality Analysis Report (2026-01-19)
**Current Score:** 80.6/100
**Target Score:** 85-90/100
**Tasks Created:** 16 (T016-T031)

---

## Overview

This roadmap addresses all issues identified in the code quality analysis report. Tasks are organized by priority and correlation for efficient execution.

**Total Estimated Time:** ~35.75 hours
**Recommended Execution:** 3-4 sprints

---

## Priority Breakdown

| Priority | Count | Est. Hours | Description |
|----------|-------|------------|-------------|
| P1-S     | 4     | 4.5h       | Critical blockers (patch 1.1.3) |
| P1-M     | 3     | 11h        | Major improvements (minor 1.2.0) |
| P2-S     | 2     | 2.5h       | Security improvements |
| P2-M     | 5     | 14.5h      | Quality & performance |
| P3       | 2     | 3.5h       | Documentation & cleanup |

---

## Sprint Plan

### Sprint 1: Critical Fixes (Patch 1.1.3)
**Goal:** Fix all blockers, ship 1.1.3
**Duration:** 1-2 days
**Total:** 4.5 hours

#### Tasks (Execute in Order)
1. **T016: Fix package.json URLs** (0.25h) - P1-S
   - Correct aipm → aipim in repository URLs
   - **Blocker:** Breaks user issue reporting

2. **T017: Fix completion.ts binary name** (0.25h) - P1-S
   - Correct aipm → aipim in bash completion
   - **Blocker:** Shell autocomplete broken

3. **T018: Investigate resume.ts truncation** (1h) - P1-S
   - Fix potentially truncated generateResumeSummary function
   - **Blocker:** Resume command might crash

4. **T019: Implement or Remove diff.ts** (3h) - P1-M
   - **Decision task:** Implement diff command OR remove stub
   - **Blocker:** Non-functional command confuses users

**Release:** v1.1.3 after Sprint 1 completion

---

### Sprint 2: Architecture & Testing (Minor 1.2.0 - Part 1)
**Goal:** Core architecture improvements + test coverage
**Duration:** 3-4 days
**Total:** 11 hours

#### Tasks (Execute in Order - Some Parallelizable)

**Phase A: Foundation (Sequential)**
1. **T020: Extract parsing utilities** (3h) - P2-M
   - Create src/utils/parser.ts
   - Refactor start.ts and resume.ts
   - **Unblocks:** T022 (easier to test commands)

2. **T021: Add coverage reporting** (2h) - P1-M
   - Configure Jest with 80% threshold
   - Identify coverage gaps
   - **Unblocks:** Visibility into test quality

**Phase B: Testing (After T020)**
3. **T022: Add command tests** (6h) - P1-M
   - Unit tests for start, resume, template
   - **Depends on:** T020 (parsing extracted)
   - **Target:** >80% command coverage

---

### Sprint 3: Performance & Quality (Minor 1.2.0 - Part 2)
**Goal:** Performance optimizations + code quality
**Duration:** 3-4 days
**Total:** 11.5 hours

#### Tasks (Many Parallelizable)

**Performance Track** (Can run in parallel)
1. **T023: Parallelize ProjectScanner** (2h) - P2-M
   - Convert sequential loop to Promise.all()
   - **Target:** 20-30% faster scanning

2. **T024: Replace execSync with spawn** (3h) - P2-M
   - Create async git helpers
   - Replace all blocking calls
   - **Target:** Non-blocking CLI

**Code Quality Track** (Can run in parallel)
3. **T025: Extract magic strings** (2h) - P2-M
   - Create enums for AI tools, commands, etc
   - **Benefits:** Type safety, no typos

4. **T026: Split long functions** (2h) - P2-M
   - Refactor generateResumeSummary and others
   - **Benefits:** Testability, readability

5. **T027: Add JSDoc to core modules** (3h) - P2-M
   - Document SignatureManager, TaskManager, etc
   - **Benefits:** Better IDE experience

**Security Track** (Can run in parallel)
6. **T028: Add path validation** (1.5h) - P2-S
   - Prevent path traversal attacks
   - **Critical:** Security hardening

7. **T029: Audit execSync security** (1h) - P2-S
   - Sanitize user input in shell commands
   - **Note:** May be covered by T024
   - **Critical:** Prevent command injection

**Release:** v1.2.0 after Sprint 3 completion

---

### Sprint 4: Polish & Documentation (Optional - Future)
**Goal:** Documentation and final cleanup
**Duration:** 1-2 days
**Total:** 3.5 hours

#### Tasks (Low Priority)
1. **T030: Create architecture ADRs** (3h) - P3
   - Document 3-5 key architectural decisions
   - **Benefits:** Knowledge preservation, onboarding

2. **T031: Remove commented debug code** (0.5h) - P3
   - Clean up signature.ts and other files
   - **Benefits:** Code cleanliness

---

## Execution Strategy

### Recommended Approach: "Quality First, Velocity Second"

#### Option A: Sequential Sprints (Recommended)
- **Best for:** Solo developer, quality focus
- **Timeline:** 4 weeks
- Execute Sprint 1 → 2 → 3 → 4 in order
- **Benefits:** Clear progress, controlled scope
- **Ship milestones:** 1.1.3 → 1.2.0 → 1.2.1

#### Option B: Parallel Tracks
- **Best for:** Multiple developers, faster delivery
- **Timeline:** 2-3 weeks
- Sprint 1 (sequential), then parallelize Sprint 2 & 3
- **Benefits:** Faster completion
- **Risks:** Merge conflicts, coordination overhead

#### Option C: Quick Wins First
- **Best for:** Immediate impact needed
- **Timeline:** 1 week for high-impact tasks
- Order: T016→T017→T018 → T021 → T028 → T029 → T031
- **Benefits:** Fast score improvement (75→82)
- **Ship:** 1.1.3 patch immediately

---

## Task Dependencies

```
Sprint 1 (Sequential):
T016 → T017 → T018 → T019
                          ↓
                      Release 1.1.3

Sprint 2:
T020 (must complete first)
  ↓
T021 (parallel ok) + T022 (depends on T020)

Sprint 3 (Most tasks parallel):
T023 ┐
T024 ├─ Performance track
     │
T025 ├─ Code quality track
T026 │
T027 ┘

T028 ┐
T029 ┘─ Security track (T029 may be covered by T024)

Sprint 4 (Fully parallel):
T030 + T031
```

---

## Score Projection

### After Sprint 1 (1.1.3 Patch)
- **Current:** 80.6/100
- **Expected:** 82/100 (+1.4)
- **Improvements:**
  - Technical Debt: 76 → 85 (blockers fixed)
  - Documentation: 80 → 82 (URLs correct)

### After Sprint 2 (Testing)
- **Expected:** 84/100 (+3.4 from baseline)
- **Improvements:**
  - Testing & Coverage: 75 → 85 (80% coverage achieved)
  - Architecture: 82 → 85 (parsing extracted)

### After Sprint 3 (Performance + Quality)
- **Expected:** 87/100 (+6.4 from baseline)
- **Improvements:**
  - Performance: 78 → 88 (parallelization + async)
  - Code Quality: 85 → 90 (constants, JSDoc, refactor)
  - Security: 88 → 92 (validation + sanitization)

### After Sprint 4 (Documentation)
- **Expected:** 88-90/100 (+7.4-9.4 from baseline)
- **Improvements:**
  - Documentation: 80 → 88 (ADRs + cleanup)
  - Technical Debt: 85 → 95 (all dead code removed)

---

## Quick Reference

### Files Created
All tasks located in: `.project/backlog/`

```
2026-01-19-T016-fix-package-urls.md
2026-01-19-T017-fix-completion-binary-name.md
2026-01-19-T018-investigate-resume-truncation.md
2026-01-19-T019-diff-command-decision.md
2026-01-19-T020-extract-parsing-utilities.md
2026-01-19-T021-add-coverage-reporting.md
2026-01-19-T022-add-command-tests.md
2026-01-19-T023-parallelize-project-scanner.md
2026-01-19-T024-replace-execsync-with-spawn.md
2026-01-19-T025-extract-magic-strings.md
2026-01-19-T026-split-long-functions.md
2026-01-19-T027-add-jsdoc-core-modules.md
2026-01-19-T028-add-path-validation.md
2026-01-19-T029-audit-execsync-security.md
2026-01-19-T030-create-architecture-adrs.md
2026-01-19-T031-cleanup-debug-code.md
```

### By Category

**Blockers (Must Fix):**
- T016: package.json URLs
- T017: completion.ts name
- T018: resume.ts truncation
- T019: diff.ts decision

**Architecture:**
- T020: Parsing utilities
- T022: Command tests
- T023: Parallelize scanner
- T024: Async git operations

**Code Quality:**
- T025: Magic strings → constants
- T026: Split long functions
- T027: JSDoc documentation

**Security:**
- T028: Path validation
- T029: execSync audit

**Testing:**
- T021: Coverage reporting
- T022: Command tests

**Documentation:**
- T030: Architecture ADRs
- T031: Debug code cleanup

---

## Success Metrics

### Quantitative
- [ ] Test coverage ≥ 80%
- [ ] Zero commented debug code
- [ ] Zero stub commands (diff implemented or removed)
- [ ] Zero magic strings for AI tools/commands
- [ ] All functions < 50 lines
- [ ] Code quality score ≥ 85/100

### Qualitative
- [ ] Codebase feels cleaner
- [ ] New contributors can onboard faster
- [ ] IDE autocomplete more helpful (JSDoc)
- [ ] CLI feels more responsive (async operations)
- [ ] Security posture improved (validation + sanitization)

---

## Risk Management

### High Risk Tasks
1. **T019 (diff.ts):** Decision uncertainty → Timebox to 1h discovery
2. **T024 (execSync):** Breaking changes → Test extensively
3. **T022 (command tests):** Large scope → Break into smaller PRs

### Mitigation Strategies
- Test after every task completion
- Atomic commits (easy rollback)
- Code review before merging
- Dogfooding (use AIPIM during development)

---

## Next Steps

1. **Review this roadmap** with team/stakeholders
2. **Choose execution strategy** (Sequential/Parallel/Quick Wins)
3. **Start Sprint 1** (critical fixes)
4. **Ship 1.1.3** after Sprint 1
5. **Continue to 1.2.0** with Sprints 2-3

---

**Last Updated:** 2026-01-19
**Created by:** Quality Analysis Process
**Status:** Ready for execution
