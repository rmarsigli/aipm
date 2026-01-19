---
title: "Add Jest Coverage Reporting with 80% Threshold"
created: 2026-01-19T02:00:00-03:00
last_updated: 2026-01-19T02:00:00-03:00
priority: P1-M
estimated_hours: 2
actual_hours: 0
status: backlog
blockers: []
tags: [testing, quality, tooling]
related_files: [jest.config.js, package.json, .github/workflows/]
---

# Task: Add Jest Coverage Reporting (T021)

## Objective

Configure Jest to generate coverage reports and enforce 80% minimum threshold for all coverage metrics.

**Success:**
- [ ] `pnpm test:coverage` command generates coverage report
- [ ] Coverage thresholds enforced (80% for statements, branches, functions, lines)
- [ ] CI fails if coverage drops below threshold
- [ ] Coverage report visible in terminal and HTML format
- [ ] Uncovered code easily identifiable

## Context

**Why:** Quality report identified missing coverage reporting. Currently no visibility into test gaps.

**Current problem:**
- No coverage metrics tracked
- Unknown which code is untested
- No quality gate for test coverage
- Can't measure testing improvement

**Impact:** Better test quality, prevent regressions, identify gaps

**Related:** Code Quality Analysis Report 2026-01-19, Testing & Coverage section (Score: 75/100)

## Implementation

### Phase 1: Configure Jest (Est: 0.5h)
- [ ] Update `jest.config.js`:
  ```javascript
  module.exports = {
    // existing config...
    collectCoverage: true,
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.test.ts',
      '!src/cli.ts', // entry point, hard to test
    ],
    coverageThreshold: {
      global: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
    coverageDirectory: 'coverage',
  };
  ```
- [ ] Add `coverage/` to `.gitignore`

### Phase 2: Update package.json Scripts (Est: 0.5h)
- [ ] Add scripts:
  ```json
  {
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      "test:coverage:watch": "jest --coverage --watch",
      "test:ci": "jest --ci --coverage --maxWorkers=2"
    }
  }
  ```
- [ ] Update existing test script to NOT collect coverage by default (performance)
- [ ] Coverage only on explicit command or CI

### Phase 3: Baseline & Gap Analysis (Est: 0.5h)
- [ ] Run `pnpm test:coverage`
- [ ] Identify current coverage percentage
- [ ] Document coverage gaps:
  - [ ] Which files have <80%?
  - [ ] Which functions are untested?
  - [ ] Critical paths missing tests?
- [ ] Create follow-up tasks for major gaps (if needed)

### Phase 4: CI Integration (Est: 0.5h)
- [ ] Update `.github/workflows/test.yml` (if exists):
  ```yaml
  - name: Run tests with coverage
    run: pnpm test:ci

  - name: Upload coverage to Codecov (optional)
    uses: codecov/codecov-action@v3
    with:
      files: ./coverage/lcov.info
  ```
- [ ] Verify CI fails if coverage < 80%
- [ ] Add coverage badge to README (optional)

## Definition of Done

### Functionality
- [ ] `pnpm test:coverage` generates report
- [ ] Coverage threshold enforced (build fails if <80%)
- [ ] HTML report opens in browser
- [ ] Terminal shows coverage summary
- [ ] Uncovered lines highlighted in HTML report

### Testing
- [ ] Coverage command works locally
- [ ] CI runs coverage check
- [ ] Threshold violation fails build (test with low threshold)
- [ ] Coverage report accurate

### Performance
- [ ] Coverage collection doesn't drastically slow tests (<2x slower)
- [ ] CI completes in reasonable time (<5 min for tests)

### Security
- [ ] Coverage reports not committed to git
- [ ] No sensitive data in coverage reports

### Code Quality
- [ ] Clean jest.config.js
- [ ] Proper .gitignore entries
- [ ] Scripts well-named

### Documentation
- [ ] Time logged
- [ ] README mentions coverage:
  ```markdown
  ## Testing

  ```bash
  # Run tests
  pnpm test

  # Run tests with coverage
  pnpm test:coverage

  # Open HTML coverage report
  open coverage/index.html
  ```

  Minimum coverage: 80%
  ```
- [ ] CONTRIBUTING.md updated (if exists)

### Git
- [ ] Atomic commits:
  1. Configure Jest coverage
  2. Add npm scripts
  3. Update documentation
  4. Add CI integration
- [ ] Convention: `feat(test): add coverage reporting with 80% threshold`
- [ ] No conflicts

## Testing

### Manual
```bash
# Generate coverage
pnpm test:coverage

# Expected output:
# ----------|---------|----------|---------|---------|-------------------
# File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
# ----------|---------|----------|---------|---------|-------------------
# All files |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
# ...

# Open HTML report
open coverage/index.html

# Verify threshold enforcement
# Temporarily lower threshold to 99% in jest.config.js
# Run pnpm test:coverage
# Should FAIL if coverage < 99%
```

### CI
```bash
# Push to branch
git push origin feature/coverage-reporting

# Check GitHub Actions
# - Build should pass if coverage >= 80%
# - Build should fail if coverage < 80%
```

## Blockers & Risks

**Current:**
- [ ] Unknown current coverage (might be <80%)
- [ ] If <80%, need to write more tests first OR lower initial threshold

**Potential:**
1. Risk: Current coverage might be very low (<50%) - Mitigation: Start with lower threshold (e.g., 60%), create tasks to improve
2. Risk: Some files might be hard to test - Mitigation: Exclude from coverage (document why)
3. Risk: CI might timeout with coverage - Mitigation: Optimize test execution

## Progress

### Time Log
| Date | Hours | Activity |
|------|-------|----------|
| | 0 | Not started |

**Total:** 0h / 2h

## Technical Notes

**Current coverage (unknown):**
```bash
# First run to see baseline
pnpm test -- --coverage --coverageReporters=text

# Document results here after first run
```

**Exclusions (if needed):**
- `src/cli.ts` - entry point, tested via E2E
- Generated files (if any)
- Type definitions
- Test files themselves

**Coverage metrics explained:**
- **Statements:** % of code statements executed
- **Branches:** % of if/else paths taken
- **Functions:** % of functions called
- **Lines:** % of lines executed

**Threshold strategy:**
- Start with 80% global (recommended by quality report)
- Can lower temporarily if current coverage very low
- Create tasks to reach 80% if not there yet

## References

- Code Quality Analysis Report: `.project/reports/code-quality-analysis-2026-01-19.md`
- Testing & Coverage section (recommendation #1)
- Jest coverage docs: https://jestjs.io/docs/configuration#collectcoverage-boolean
- Coverage best practices: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## Retrospective (Post-completion)

**Went well:**
-

**Improve:**
-

**Estimate:**
- Est: 2h, Actual: ___h, Diff: ___%

**Lessons:**
1.

**Coverage baseline:**
- Before: ___% (unknown)
- After: ___% (target: ≥80%)

## Completion

- [ ] All DoD checked
- [ ] Time logged
- [ ] Retrospective done
- [ ] Context updated
- [ ] Git merged/ready
- [ ] Validation passed
- [ ] Coverage ≥80% OR follow-up tasks created

**Completed:** ___________
**Final time:** _____ hours
