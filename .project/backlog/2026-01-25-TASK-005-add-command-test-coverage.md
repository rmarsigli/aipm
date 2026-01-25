---
title: "Add test coverage for untested commands"
created: 2026-01-25T18:50:00-03:00
last_updated: 2026-01-25T18:50:00-03:00
priority: P1-L
estimated_hours: 6
actual_hours: 0
status: backlog
blockers: []
tags: [testing, coverage, quality]
related_files:
  - src/commands/pause.ts
  - src/commands/deps.ts
  - src/commands/task.ts
  - src/commands/completion.ts
  - src/commands/update.ts
  - tests/commands/pause.test.ts (new)
  - tests/commands/deps.test.ts (new)
  - tests/commands/task.test.ts (new)
---

# Task: Add Test Coverage for Untested Commands

## Objective

Add comprehensive test coverage for 5 commands that currently have 0% coverage, bringing overall test coverage from 54% to 65%+.

**Success:**
- [ ] pause.ts: 0% → 70%+ coverage
- [ ] deps.ts: 0% → 70%+ coverage
- [ ] task.ts: 0% → 70%+ coverage
- [ ] completion.ts: 0% → 50%+ (lower priority)
- [ ] update.ts: 0% → 60%+ coverage
- [ ] Overall coverage: 54% → 65%+

## Context

**Why:**
Current test coverage shows 5 commands with **zero tests**:

```
src/commands/
├── completion.ts    0% 🔴  (38 lines, 0 tests)
├── deps.ts          0% 🔴  (85 lines, 0 tests)
├── pause.ts         0% 🔴  (69 lines, 0 tests)
├── task.ts          0% 🔴  (149 lines, 0 tests)
└── update.ts        0% 🔴  (81 lines, 0 tests)
```

**Problems:**
- **Risk:** Bugs can slip into production undetected
- **Confidence:** Can't refactor safely without tests
- **Regression:** Changes may break existing functionality
- **Quality:** Coverage dropped from 80% (v1.1.3) to 54% (v1.3.0)

**Why This Happened:**
- Commands added quickly without tests
- Focus on features over quality
- Test debt accumulated

**Priority Order:** (by risk and usage)
1. **pause.ts** - Critical workflow command
2. **task.ts** - Core functionality
3. **deps.ts** - Useful but lower risk
4. **update.ts** - Important but less used
5. **completion.ts** - Nice-to-have

**Related:**
- Quality Report: .project/reports/code-quality-analysis-2026-01-25.md (Issue #5)
- Current coverage: `npm test -- --coverage`

## Implementation

### Phase 1: Test pause.ts (Est: 1.5h) - HIGHEST PRIORITY
- [ ] Create `tests/commands/pause.test.ts`
- [ ] Mock git operations (uses git util)
- [ ] Mock file system (uses fs for snapshots)

**Test Cases for pause.ts:**

```typescript
import { pause } from '@/commands/pause.js'
import { git } from '@/utils/git.js'
import fs from 'fs-extra'
import path from 'path'

jest.mock('@/utils/git.js')
jest.mock('fs-extra')

describe('pause command', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'log').mockImplementation()
    })

    test('pauses session with reason', async () => {
        // Arrange
        const projectRoot = '/test/project'
        const reason = 'lunch break'

        git.mockResolvedValueOnce('file.ts\nchanged')  // git status
        fs.existsSync.mockReturnValue(true)
        fs.ensureDir.mockResolvedValue()
        fs.writeFile.mockResolvedValue()

        // Act
        await pause({ reason, stash: true })

        // Assert
        expect(git).toHaveBeenCalledWith(['status', '--porcelain'])
        expect(git).toHaveBeenCalledWith(['stash', 'push', '-m', expect.stringContaining(reason)])
        expect(fs.writeFile).toHaveBeenCalled()  // Snapshot created
    })

    test('handles clean working directory (nothing to stash)', async () => {
        git.mockResolvedValueOnce('')  // Empty status = clean

        await pause({ reason: 'test', stash: true })

        // Should not call stash
        expect(git).not.toHaveBeenCalledWith(['stash', 'push', expect.anything()])
    })

    test('pauses without stashing when stash=false', async () => {
        git.mockResolvedValueOnce('changes')  // Has changes

        await pause({ reason: 'test', stash: false })

        // Should not stash even with changes
        expect(git).not.toHaveBeenCalledWith(['stash', expect.anything()])
    })

    test('creates snapshot file with correct structure', async () => {
        git.mockResolvedValue('')

        await pause({ reason: 'meeting' })

        expect(fs.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('.snapshots/pause-'),
            expect.stringMatching(/timestamp.*reason.*task/s),  // JSON structure
            'utf-8'
        )
    })

    test('handles git errors gracefully', async () => {
        git.mockRejectedValue(new Error('Git not installed'))

        await expect(pause({ reason: 'test' })).rejects.toThrow('Git not installed')
    })

    test('validates required reason parameter', async () => {
        await expect(pause({ reason: '' })).rejects.toThrow(/reason.*required/i)
    })
})
```

**Coverage Target:** 70%+ (most logic, except error edges)

### Phase 2: Test task.ts (Est: 2h) - HIGH PRIORITY
- [ ] Create `tests/commands/task.test.ts`
- [ ] Mock taskManager operations
- [ ] Test all subcommands: init, start, complete, pause

**Test Cases for task.ts:**

```typescript
import { task } from '@/commands/task.js'
import { taskManager } from '@/core/task-manager.js'
import fs from 'fs-extra'

jest.mock('@/core/task-manager.js')
jest.mock('fs-extra')

describe('task command', () => {
    test('task init creates new task', async () => {
        taskManager.initTask.mockResolvedValue('TASK-001')

        await task({ command: 'init', name: 'New Feature' })

        expect(taskManager.initTask).toHaveBeenCalledWith({
            name: 'New Feature',
            priority: expect.any(String)
        })
    })

    test('task start moves task to current', async () => {
        fs.existsSync.mockReturnValue(true)
        fs.readdir.mockResolvedValue(['TASK-001-feature.md'])

        await task({ command: 'start', id: 'TASK-001' })

        expect(fs.move).toHaveBeenCalledWith(
            expect.stringContaining('backlog/TASK-001'),
            expect.stringContaining('current-task.md')
        )
    })

    test('task complete archives to completed/', async () => {
        fs.existsSync.mockReturnValue(true)

        await task({ command: 'complete' })

        expect(fs.move).toHaveBeenCalledWith(
            expect.stringContaining('current-task.md'),
            expect.stringMatching(/completed.*\.md$/)
        )
    })

    test('task list shows backlog tasks', async () => {
        fs.existsSync.mockReturnValue(true)
        fs.readdir.mockResolvedValue([
            'TASK-001-feature.md',
            'TASK-002-bugfix.md'
        ])

        await task({ command: 'list' })

        // Should output task list
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('TASK-001'))
    })

    test('handles missing task file gracefully', async () => {
        fs.existsSync.mockReturnValue(false)

        await expect(task({ command: 'start', id: 'TASK-999' })).rejects.toThrow(/not found/i)
    })
})
```

**Coverage Target:** 70%+ (all commands, most branches)

### Phase 3: Test deps.ts (Est: 1h) - MEDIUM PRIORITY
- [ ] Create `tests/commands/deps.test.ts`
- [ ] Mock file system for reading tasks
- [ ] Test dependency parsing and visualization

**Test Cases for deps.ts:**

```typescript
import { deps } from '@/commands/deps.js'
import fs from 'fs-extra'

describe('deps command', () => {
    test('shows dependencies graph', async () => {
        fs.existsSync.mockReturnValue(true)
        fs.readdir.mockResolvedValue(['TASK-001.md', 'TASK-002.md'])
        fs.readFile
            .mockResolvedValueOnce('---\ndependsOn: [TASK-002]\n---')  // TASK-001
            .mockResolvedValueOnce('---\n---')  // TASK-002

        await deps({})

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('TASK-001'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('TASK-002'))
    })

    test('detects circular dependencies', async () => {
        fs.existsSync.mockReturnValue(true)
        fs.readdir.mockResolvedValue(['TASK-001.md', 'TASK-002.md'])
        fs.readFile
            .mockResolvedValueOnce('---\ndependsOn: [TASK-002]\n---')
            .mockResolvedValueOnce('---\ndependsOn: [TASK-001]\n---')  // Circular!

        await deps({})

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Circular'))
    })

    test('handles tasks with no dependencies', async () => {
        fs.readdir.mockResolvedValue(['TASK-001.md'])
        fs.readFile.mockResolvedValue('---\n---')  // No deps

        await deps({})

        // Should show task without errors
        expect(console.log).toHaveBeenCalled()
    })
})
```

**Coverage Target:** 70%+ (main logic, skip complex ASCII art rendering)

### Phase 4: Test update.ts (Est: 1h) - MEDIUM PRIORITY
- [ ] Create `tests/commands/update.test.ts`
- [ ] Mock updater class
- [ ] Test interactive and non-interactive modes

```typescript
import { update } from '@/commands/update.js'
import { updater } from '@/core/updater.js'
import { promptConfiguration } from '@/prompts/install.js'

jest.mock('@/core/updater.js')
jest.mock('@/prompts/install.js')

describe('update command', () => {
    test('runs update with provided options', async () => {
        updater.update.mockResolvedValue([])

        await update({ ai: ['claude-code'], guidelines: ['react'] })

        expect(updater.update).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                ais: ['claude-code'],
                guidelines: ['react']
            })
        )
    })

    test('prompts for config when no options provided', async () => {
        promptConfiguration.mockResolvedValue({ ais: ['gemini'] })
        updater.update.mockResolvedValue([])

        await update({})

        expect(promptConfiguration).toHaveBeenCalled()
        expect(updater.update).toHaveBeenCalled()
    })

    test('handles update errors gracefully', async () => {
        updater.update.mockRejectedValue(new Error('Update failed'))

        await expect(update({})).rejects.toThrow('Update failed')
    })
})
```

**Coverage Target:** 60%+ (basic flows, skip complex error scenarios)

### Phase 5: Test completion.ts (Est: 0.5h) - LOW PRIORITY
- [ ] Create `tests/commands/completion.test.ts`
- [ ] Test shell completion generation

```typescript
import { completion } from '@/commands/completion.js'

describe('completion command', () => {
    test('generates bash completion', async () => {
        await completion({ shell: 'bash' })

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('aipim'))
    })

    test('generates zsh completion', async () => {
        await completion({ shell: 'zsh' })

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('compdef'))
    })

    test('defaults to bash if shell not specified', async () => {
        await completion({})

        expect(console.log).toHaveBeenCalled()
    })
})
```

**Coverage Target:** 50%+ (basic functionality only)

### Phase 6: Update Coverage Threshold (Est: 0.5h)
- [ ] Open `jest.config.js`
- [ ] Update coverage thresholds:

**Before:**
```javascript
coverageThreshold: {
    global: {
        branches: 40,
        functions: 50,
        lines: 50,
        statements: 50
    }
}
```

**After:**
```javascript
coverageThreshold: {
    global: {
        branches: 50,    // +10
        functions: 60,   // +10
        lines: 65,       // +15
        statements: 65   // +15
    }
}
```

## Definition of Done

### Functionality
- [ ] All 5 commands have test files
- [ ] Minimum 3 test cases per command
- [ ] Happy path + error cases covered
- [ ] Edge cases tested (empty input, missing files, etc.)

### Testing
- [ ] pause.ts: 70%+ coverage
- [ ] task.ts: 70%+ coverage
- [ ] deps.ts: 70%+ coverage
- [ ] update.ts: 60%+ coverage
- [ ] completion.ts: 50%+ coverage
- [ ] **Overall coverage: 65%+** (up from 54%)
- [ ] All new tests pass
- [ ] All existing tests still pass

### Performance
- [ ] Test suite completes in <10 seconds
- [ ] No slow tests (>1s each)
- [ ] Mocks used appropriately (no real git/fs operations)

### Code Quality
- [ ] Tests follow existing patterns (see start.test.ts, resume.test.ts)
- [ ] Clear test descriptions
- [ ] Arrange-Act-Assert pattern
- [ ] No console.log in tests

### Documentation
- [ ] Test file headers explain what's being tested
- [ ] Complex test cases have comments
- [ ] Coverage report updated in quality docs

### Git
- [ ] Single commit per command tested (5 commits total)
- [ ] Format: `test(pause): add comprehensive test coverage`
- [ ] Each commit message lists coverage improvement

## Testing Strategy

### Mocking Approach
```typescript
// File System
jest.mock('fs-extra')

// Git Operations
jest.mock('@/utils/git.js')

// Task Manager
jest.mock('@/core/task-manager.js')

// User Input (if needed)
jest.mock('@inquirer/prompts')
```

### Test Structure
```typescript
describe('command name', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Setup common mocks
    })

    describe('happy path', () => {
        test('scenario 1', () => { /* ... */ })
        test('scenario 2', () => { /* ... */ })
    })

    describe('error handling', () => {
        test('error 1', () => { /* ... */ })
        test('error 2', () => { /* ... */ })
    })

    describe('edge cases', () => {
        test('edge 1', () => { /* ... */ })
        test('edge 2', () => { /* ... */ })
    })
})
```

## Blockers & Risks

**Current:**
- [ ] None - tests can be added independently

**Potential:**
1. **Risk:** Mocking complex dependencies
   - **Mitigation:** Use existing test patterns from start.test.ts
   - **Action:** Study how other commands mock git/fs

2. **Risk:** Coverage threshold fails CI
   - **Mitigation:** Update thresholds incrementally
   - **Action:** Run `npm test -- --coverage` before committing

3. **Risk:** Tests too slow
   - **Mitigation:** Use mocks, not real file operations
   - **Action:** Profile test suite if >10s

## References

- Existing Tests: `tests/commands/start.test.ts`, `tests/commands/resume.test.ts`
- Coverage Config: `jest.config.js`
- Quality Report: `.project/reports/code-quality-analysis-2026-01-25.md` (Issue #5)

## Instructions for Gemini

**You are writing tests for 5 untested commands. Work incrementally:**

1. **Start with pause.ts (highest priority):**
   - Create `tests/commands/pause.test.ts`
   - Add 6+ test cases (see Phase 1)
   - Run `npm test -- pause.test.ts` to verify
   - Commit: `test(pause): add comprehensive test coverage`
   - Check coverage: Should be ~70%

2. **Then task.ts:**
   - Create `tests/commands/task.test.ts`
   - Add 6+ test cases (see Phase 2)
   - Run tests, verify, commit
   - Coverage should be ~70%

3. **Then deps.ts:**
   - Create `tests/commands/deps.test.ts`
   - Add 4+ test cases (see Phase 3)
   - Run tests, verify, commit

4. **Then update.ts:**
   - Create `tests/commands/update.test.ts`
   - Add 4+ test cases (see Phase 4)
   - Run tests, verify, commit

5. **Finally completion.ts (low priority):**
   - Create `tests/commands/completion.test.ts`
   - Add 3+ basic test cases
   - Run tests, verify, commit

6. **Update Coverage Thresholds:**
   - Edit `jest.config.js`
   - Increase thresholds (see Phase 6)
   - Run full test suite: `npm test -- --coverage`
   - Verify overall coverage ≥65%
   - Commit: `test(config): increase coverage thresholds to 65%`

**Quality Checklist (per test file):**
- [ ] Follows existing test patterns
- [ ] Uses mocks for git/fs/prompts
- [ ] Tests happy path + errors + edges
- [ ] Clear test descriptions
- [ ] Tests are fast (<100ms each)
- [ ] All tests pass

**DO NOT:**
- ❌ Write integration tests (use unit tests with mocks)
- ❌ Use real file system or git
- ❌ Write slow tests (>1s)
- ❌ Skip error cases
- ❌ Copy-paste without understanding

Work on **ONE command at a time**, test, commit, then move to next.
