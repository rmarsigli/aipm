---
title: "Add Unit Tests for Commands (start, resume, template)"
created: 2026-01-19T02:00:00-03:00
last_updated: 2026-01-19T02:00:00-03:00
priority: P1-M
estimated_hours: 6
actual_hours: 0
status: in-progress
blockers: [T020-extract-parsing-utilities]
tags: [testing, quality, commands]
related_files: [tests/commands/, src/commands/start.ts, src/commands/resume.ts, src/commands/template.ts]
---

# Task: Add Unit Tests for Commands (T022)

## Objective

Write comprehensive unit tests for untested commands: `start`, `resume`, and `template`. Increase test coverage and prevent regressions.

**Success:**
- [ ] All three commands have unit test files
- [ ] Critical paths covered (happy path + edge cases)
- [ ] Command coverage >80%
- [ ] Tests are fast (<1s per command)
- [ ] CI runs tests automatically

## Context

**Why:** Quality report identified missing command tests. Commands are public API - must be tested.

**Current problem:**
- Commands tested only via E2E (slow, brittle)
- No isolated unit tests for command logic
- Hard to test edge cases
- Regressions not caught early

**Impact:** Better quality, faster feedback, easier refactoring

**Related:** Code Quality Analysis Report 2026-01-19, Testing & Coverage section (Score: 75/100)

## Implementation

### Phase 1: Test start.ts (Est: 2h)
- [ ] Create `tests/commands/start.test.ts`
- [ ] Test scenarios:
  - [ ] Generates correct prompt from context.md
  - [ ] Generates correct prompt from current-task.md
  - [ ] Handles missing files gracefully
  - [ ] Includes git status in prompt
  - [ ] Includes recent commits
  - [ ] Handles empty/invalid YAML
  - [ ] Clipboard mode works (`--copy`)
  - [ ] File output mode works (`--file`)
  - [ ] Print mode works (`--print`)
- [ ] Mock file system (fs-extra)
- [ ] Mock git commands (execSync)
- [ ] Mock clipboard (clipboardy)

### Phase 2: Test resume.ts (Est: 2h)
- [ ] Create `tests/commands/resume.test.ts`
- [ ] Test scenarios:
  - [ ] Shows session age correctly (fresh/recent/old)
  - [ ] Calculates progress percentage
  - [ ] Extracts recent checkboxes
  - [ ] Shows next action from context
  - [ ] Handles no current task
  - [ ] Handles completed task
  - [ ] Handles empty context
  - [ ] Interactive prompt works
  - [ ] Auto mode skips prompt (`--auto`)
  - [ ] Displays last commit
- [ ] Mock file reads
- [ ] Mock git commands
- [ ] Mock inquirer prompts

### Phase 3: Test template.ts (Est: 1.5h)
- [ ] Create `tests/commands/template.test.ts`
- [ ] Test scenarios:
  - [ ] Lists available templates
  - [ ] Shows template content
  - [ ] Validates template format
  - [ ] Handles missing templates
  - [ ] JSON output mode works
- [ ] Mock template directory
- [ ] Mock file reads

### Phase 4: Refactor for Testability (Est: 0.5h)
- [ ] Extract pure functions where possible
- [ ] Dependency injection for file system
- [ ] Separate logic from I/O
- [ ] Make mocking easier

## Definition of Done

### Functionality
- [ ] All test files exist and run
- [ ] Tests cover:
  - [ ] Happy path
  - [ ] Edge cases (missing files, invalid data)
  - [ ] Error scenarios
  - [ ] All flags/options
  - [ ] User interactions

### Testing
- [ ] Each command has ≥10 tests
- [ ] Command files coverage >80%
- [ ] All tests pass (`pnpm test`)
- [ ] Tests are isolated (no shared state)
- [ ] Tests run fast (<1s per file)
- [ ] No flaky tests

### Performance
- [ ] Test suite completes in <10s total
- [ ] Proper use of mocks (no real file I/O)

### Security
- [ ] Tests don't leak sensitive data
- [ ] Mock data is safe

### Code Quality
- [ ] TypeScript strict mode
- [ ] Proper test structure (describe/test)
- [ ] Clear test names (behavior-driven)
- [ ] No commented tests
- [ ] Clean mocking patterns

### Documentation
- [ ] Time logged
- [ ] Test files have descriptive comments
- [ ] README mentions how to run tests
- [ ] CONTRIBUTING.md updated (test guidelines)

### Git
- [ ] Atomic commits (one per command)
  1. Add tests for start.ts
  2. Add tests for resume.ts
  3. Add tests for template.ts
  4. Refactor for testability (if needed)
- [ ] Convention: `test(commands): add unit tests for start/resume/template`
- [ ] No conflicts

## Testing

### Example Test Structure
```typescript
// tests/commands/start.test.ts
import { jest } from '@jest/globals';
import * as fs from 'fs-extra';
import { execSync } from 'child_process';

jest.mock('fs-extra');
jest.mock('child_process');

describe('start command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('prompt generation', () => {
    test('includes context from context.md', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(`---
session: 5
next_action: "Continue work"
---
# Current State
Working on feature X`);

      const prompt = await generatePrompt();
      expect(prompt).toContain('session: 5');
      expect(prompt).toContain('Continue work');
    });

    test('handles missing context.md gracefully', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      const prompt = await generatePrompt();
      expect(prompt).toContain('No context found');
    });
  });

  describe('output modes', () => {
    test('copies to clipboard when --copy flag used', async () => {
      const clipboardy = await import('clipboardy');
      const writeSpy = jest.spyOn(clipboardy, 'write');

      await startCommand({ copy: true });

      expect(writeSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('error handling', () => {
    test('shows user-friendly error for invalid YAML', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('---\ninvalid: yaml: broken\n---');

      await expect(generatePrompt()).rejects.toThrow('Invalid YAML');
    });
  });
});
```

### Manual Verification
```bash
# Run tests
pnpm test commands

# Run with coverage
pnpm test:coverage commands/

# Verify coverage
# - start.ts: >80%
# - resume.ts: >80%
# - template.ts: >80%
```

## Blockers & Risks

**Current:**
- [x] **Blocked by T020**: Parsing utilities should be extracted first for easier testing

**Potential:**
1. Risk: Commands tightly coupled to file system - Mitigation: Refactor for dependency injection
2. Risk: Mocking is complex - Mitigation: Use jest.mock() and jest.spyOn()
3. Risk: Tests become brittle - Mitigation: Focus on behavior, not implementation
4. Risk: Time estimate too low - Mitigation: Break into smaller tasks if needed

## Progress

### Time Log
| Date | Hours | Activity |
|------|-------|----------|
| | 0 | Not started (blocked by T020) |

**Total:** 0h / 6h

## Technical Notes

**Mocking patterns:**
```typescript
// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock execSync (git commands)
jest.mock('child_process');
const mockExec = execSync as jest.MockedFunction<typeof execSync>;

// Mock clipboardy
jest.mock('clipboardy');

// Mock inquirer (prompts)
jest.mock('inquirer');
```

**Test organization:**
```
tests/
├── commands/
│   ├── start.test.ts    # NEW
│   ├── resume.test.ts   # NEW
│   └── template.test.ts # NEW
├── core/
│   ├── detector.test.ts # existing
│   ├── installer.test.ts # existing
│   └── ...
└── utils/
    └── parser.test.ts   # created in T020
```

**Coverage targets:**
- start.ts: 80%+ (focus on prompt generation)
- resume.ts: 80%+ (focus on parsing and display logic)
- template.ts: 80%+ (simpler, should reach 90%+)

## References

- Code Quality Analysis Report: `.project/reports/code-quality-analysis-2026-01-19.md`
- Testing & Coverage section (recommendation #2)
- Jest mocking guide: https://jestjs.io/docs/mock-functions
- Testing best practices: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## Retrospective (Post-completion)

**Went well:**
-

**Improve:**
-

**Estimate:**
- Est: 6h, Actual: ___h, Diff: ___%

**Lessons:**
1.

**Coverage improvement:**
- start.ts: before ___%, after ___%
- resume.ts: before ___%, after ___%
- template.ts: before ___%, after ___%

## Completion

- [ ] All DoD checked
- [ ] Time logged
- [ ] Retrospective done
- [ ] Context updated
- [ ] Git merged/ready
- [ ] Validation passed
- [ ] Coverage targets met

**Completed:** ___________
**Final time:** _____ hours
