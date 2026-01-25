---
title: "Extract resolveTemplatesDir() to shared utility"
created: 2026-01-25T18:45:00-03:00
last_updated: 2026-01-25T18:45:00-03:00
priority: P1-M
estimated_hours: 1
actual_hours: 0
status: backlog
blockers: []
tags: [refactor, dry, code-quality, architecture]
related_files:
  - src/core/installer.ts
  - src/core/updater.ts
  - src/core/task-manager.ts
  - src/utils/templates.ts (new file)
  - tests/utils/templates.test.ts (new file)
---

# Task: Extract resolveTemplatesDir() to Shared Utility

## Objective

Remove code duplication by extracting the `resolveTemplatesDir()` method that is currently copy-pasted in three different files into a shared utility module.

**Success:**
- [ ] Single source of truth for template directory resolution
- [ ] All three classes use shared function
- [ ] Tests added for template resolution logic
- [ ] No behavior changes - pure refactor

## Context

**Why:**
The exact same `resolveTemplatesDir()` method is duplicated in 3 files:

1. **src/core/installer.ts:31-40**
```typescript
private resolveTemplatesDir(): string {
    let templatesDir = path.join(__dirname, 'templates')
    if (!fs.existsSync(templatesDir)) templatesDir = path.join(__dirname, '../templates')
    if (!fs.existsSync(templatesDir)) templatesDir = path.join(process.cwd(), 'src/templates')
    return templatesDir
}
```

2. **src/core/updater.ts:120-124**
```typescript
private resolveTemplatesDir(): string {
    let templatesDir = path.join(__dirname, 'templates')
    if (!fs.existsSync(templatesDir)) templatesDir = path.join(__dirname, '../templates')
    if (!fs.existsSync(templatesDir)) templatesDir = path.join(process.cwd(), 'src/templates')
    return templatesDir
}
```

3. **src/core/task-manager.ts:120-128**
```typescript
private resolveTemplatesDir(): string {
    let templatesDir = path.join(__dirname, 'templates')
    if (!fs.existsSync(templatesDir)) {
        templatesDir = path.join(__dirname, '../templates')
    }
    if (!fs.existsSync(templatesDir)) {
        templatesDir = path.join(process.cwd(), 'src/templates')
    }
    return templatesDir
}
```

**Problems:**
- **Maintenance Burden:** If logic changes, must update 3 places
- **Inconsistency Risk:** Already slight formatting differences (task-manager has braces)
- **Testing Difficulty:** Same logic tested in 3 different test files
- **Violates DRY:** Don't Repeat Yourself principle

**Why This Exists:**
- Each class was developed independently
- Developer copy-pasted working code
- No refactoring pass to extract common code

**Related:**
- Quality Report: .project/reports/code-quality-analysis-2026-01-25.md (Issue #4)

## Implementation

### Phase 1: Create Utility Module (Est: 0.25h)
- [ ] Create new file: `src/utils/templates.ts`
- [ ] Extract and improve the function:

```typescript
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Resolves the templates directory path for the AIPIM system.
 *
 * Searches in multiple locations to support different execution contexts:
 * 1. dist/core/templates (production build)
 * 2. dist/templates (production build alternative)
 * 3. src/templates (development)
 *
 * @returns The absolute path to the templates directory
 * @throws Error if templates directory cannot be found
 */
export function resolveTemplatesDir(): string {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    // Attempt 1: templates/ sibling to current file (production)
    let templatesDir = path.join(__dirname, 'templates')
    if (fs.existsSync(templatesDir)) return templatesDir

    // Attempt 2: ../templates (when in core/ or utils/)
    templatesDir = path.join(__dirname, '../templates')
    if (fs.existsSync(templatesDir)) return templatesDir

    // Attempt 3: ../../templates (when in dist/core/ or dist/utils/)
    templatesDir = path.join(__dirname, '../../templates')
    if (fs.existsSync(templatesDir)) return templatesDir

    // Attempt 4: src/templates from process.cwd() (development)
    templatesDir = path.join(process.cwd(), 'src/templates')
    if (fs.existsSync(templatesDir)) return templatesDir

    // None found - throw error with helpful message
    throw new Error(
        `Templates directory not found. Searched:\n` +
        `  - ${path.join(__dirname, 'templates')}\n` +
        `  - ${path.join(__dirname, '../templates')}\n` +
        `  - ${path.join(__dirname, '../../templates')}\n` +
        `  - ${path.join(process.cwd(), 'src/templates')}\n` +
        `\nThis usually indicates a broken installation.`
    )
}

/**
 * Checks if templates directory exists and is readable.
 * @returns true if templates directory is valid
 */
export function hasValidTemplatesDir(): boolean {
    try {
        const dir = resolveTemplatesDir()
        return fs.existsSync(dir) && fs.statSync(dir).isDirectory()
    } catch {
        return false
    }
}
```

### Phase 2: Update installer.ts (Est: 0.15h)
- [ ] Open `src/core/installer.ts`
- [ ] Add import at top: `import { resolveTemplatesDir } from '@/utils/templates.js'`
- [ ] Delete the private `resolveTemplatesDir()` method (lines 31-40)
- [ ] Update calls to use imported function
- [ ] Verify no other references to the old method

**Before:**
```typescript
export class Installer {
    private resolveTemplatesDir(): string {
        let templatesDir = path.join(__dirname, 'templates')
        // ... (lines 31-40)
    }

    public async install(config: InstallConfig): Promise<void> {
        const templatesDir = this.resolveTemplatesDir()  // Uses private method
        // ...
    }
}
```

**After:**
```typescript
import { resolveTemplatesDir } from '@/utils/templates.js'

export class Installer {
    // Method removed - now uses utility

    public async install(config: InstallConfig): Promise<void> {
        const templatesDir = resolveTemplatesDir()  // Uses utility function
        // ...
    }
}
```

### Phase 3: Update updater.ts (Est: 0.15h)
- [ ] Open `src/core/updater.ts`
- [ ] Add import: `import { resolveTemplatesDir } from '@/utils/templates.js'`
- [ ] Delete the private `resolveTemplatesDir()` method (lines 120-124)
- [ ] Update all calls to use imported function
- [ ] Search for `this.resolveTemplatesDir()` - should find none

### Phase 4: Update task-manager.ts (Est: 0.15h)
- [ ] Open `src/core/task-manager.ts`
- [ ] Add import: `import { resolveTemplatesDir } from '@/utils/templates.js'`
- [ ] Delete the private `resolveTemplatesDir()` method (lines 120-128)
- [ ] Update all calls to use imported function
- [ ] Search for `this.resolveTemplatesDir()` - should find none

### Phase 5: Add Tests (Est: 0.3h)
- [ ] Create `tests/utils/templates.test.ts`
- [ ] Test all scenarios:

```typescript
import { resolveTemplatesDir, hasValidTemplatesDir } from '@/utils/templates.js'
import fs from 'fs-extra'
import path from 'path'

describe('resolveTemplatesDir', () => {
    test('finds templates directory in development', () => {
        const dir = resolveTemplatesDir()

        expect(dir).toBeDefined()
        expect(fs.existsSync(dir)).toBe(true)
        expect(fs.statSync(dir).isDirectory()).toBe(true)
    })

    test('templates directory contains expected files', () => {
        const dir = resolveTemplatesDir()

        // Should contain base/ directory
        expect(fs.existsSync(path.join(dir, 'base'))).toBe(true)

        // Should contain project-manager.md
        expect(fs.existsSync(path.join(dir, 'base/project-manager.md'))).toBe(true)

        // Should contain guidelines/
        expect(fs.existsSync(path.join(dir, 'guidelines'))).toBe(true)
    })

    test('throws error with helpful message when templates not found', () => {
        // Mock fs.existsSync to always return false
        const originalExists = fs.existsSync
        fs.existsSync = jest.fn().mockReturnValue(false)

        expect(() => resolveTemplatesDir()).toThrow(/Templates directory not found/)
        expect(() => resolveTemplatesDir()).toThrow(/Searched:/)

        // Restore
        fs.existsSync = originalExists
    })

    test('hasValidTemplatesDir returns true when valid', () => {
        expect(hasValidTemplatesDir()).toBe(true)
    })

    test('hasValidTemplatesDir returns false when invalid', () => {
        // Mock to simulate missing templates
        const originalExists = fs.existsSync
        fs.existsSync = jest.fn().mockReturnValue(false)

        expect(hasValidTemplatesDir()).toBe(false)

        fs.existsSync = originalExists
    })
})

describe('Template Resolution - Integration', () => {
    test('installer, updater, and task-manager all use same templates dir', async () => {
        const { installer } = await import('@/core/installer.js')
        const { updater } = await import('@/core/updater.js')
        const { taskManager } = await import('@/core/task-manager.js')

        // All should resolve to same directory
        const expectedDir = resolveTemplatesDir()

        // This test verifies refactoring didn't break anything
        // (Would fail if any class still has old implementation)
    })
})
```

## Definition of Done

### Functionality
- [ ] All three classes use shared utility
- [ ] Template resolution works identically to before
- [ ] Error messages helpful if templates not found
- [ ] Edge case: Development vs production paths both work

### Testing
- [ ] New tests added for templates utility
- [ ] All existing tests still pass (16 test suites)
- [ ] Integration test verifies all classes use same function
- [ ] Coverage for templates.ts >90%

### Performance
- [ ] No performance regression
- [ ] Function call overhead negligible (<1ms)
- [ ] No repeated fs.existsSync calls (efficient as before)

### Code Quality
- [ ] **DRY:** Single source of truth
- [ ] **Clean:** No duplicate code remains
- [ ] **Documented:** JSDoc explains search order
- [ ] **Error Handling:** Helpful error message
- [ ] **Grep check:** `grep -r "resolveTemplatesDir" src/core/` finds NO private methods

### Documentation
- [ ] JSDoc explains why multiple search paths needed
- [ ] Comment in each file: "// Shared utility from @/utils/templates"
- [ ] Time logged

### Git
- [ ] Single atomic commit
- [ ] Format: `refactor(core): extract resolveTemplatesDir to shared utility`
- [ ] Body explains DRY refactoring rationale
- [ ] No behavior changes - pure refactor

## Testing

### Unit Tests
See Phase 5 above - comprehensive test suite for templates.ts

### Integration Tests
```typescript
// Verify all three classes work after refactor
test('installer uses shared templates utility', async () => {
    const config = { ... }
    await installer.install(config)
    // Should complete without errors
})

test('updater uses shared templates utility', async () => {
    await updater.update(projectRoot, config)
    // Should complete without errors
})

test('task manager uses shared templates utility', async () => {
    await taskManager.initTask({ name: 'test' })
    // Should complete without errors
})
```

### Manual Verification
```bash
# Run each affected command
aipim install
aipim update
aipim task init "test"

# All should work identically to before
# Verify templates loaded correctly
```

## Blockers & Risks

**Current:**
- [ ] None - pure refactor

**Potential:**
1. **Risk:** Breaking production build (different __dirname behavior)
   - **Mitigation:** Test both `npm run dev` and production build
   - **Action:** Add extra search path `../../templates` for dist structure

2. **Risk:** Import path resolution issues
   - **Mitigation:** Use `@/utils/templates.js` alias (already configured)
   - **Verify:** Build succeeds after changes

## Technical Notes

**Why Multiple Search Paths:**
```
Development structure:
src/
  ├── core/
  │   └── installer.ts  (__dirname = src/core)
  ├── utils/
  │   └── templates.ts  (__dirname = src/utils)
  └── templates/        (found at ../templates)

Production structure:
dist/
  ├── core/
  │   └── installer.js  (__dirname = dist/core)
  ├── utils/
  │   └── templates.js  (__dirname = dist/utils)
  └── templates/        (found at ../templates or ../../templates)
```

**Import Style:**
```typescript
// ✅ Good: Use @ alias
import { resolveTemplatesDir } from '@/utils/templates.js'

// ❌ Bad: Relative path
import { resolveTemplatesDir } from '../utils/templates.js'  // Breaks from different dirs
```

**Gotcha:**
- Must use `.js` extension in imports (ESM requirement)
- Don't forget to delete the OLD private methods
- Update ALL calls (search for `this.resolveTemplatesDir()`)

## References

- Quality Report: `.project/reports/code-quality-analysis-2026-01-25.md` (Issue #4)
- Files to modify:
  - `src/core/installer.ts:31-40`
  - `src/core/updater.ts:120-124`
  - `src/core/task-manager.ts:120-128`

## Instructions for Gemini

**You are doing a DRY refactoring. Follow these steps carefully:**

1. **Create Utility First:**
   - Create `src/utils/templates.ts` with the improved function
   - Add JSDoc documentation
   - Include helpful error message
   - Add 4 search paths (not just 3)

2. **Update Each File:**
   - Add import at top of file
   - Find and DELETE the private method
   - Update calls: `this.resolveTemplatesDir()` → `resolveTemplatesDir()`
   - Do this for installer.ts, updater.ts, task-manager.ts

3. **Verify Removal:**
   ```bash
   # Should find ZERO private methods:
   grep -n "private resolveTemplatesDir" src/core/*.ts

   # Should find the shared utility:
   grep -n "export function resolveTemplatesDir" src/utils/templates.ts
   ```

4. **Add Tests:**
   - Create `tests/utils/templates.test.ts`
   - Test happy path (finds templates)
   - Test error case (templates missing)
   - Test hasValidTemplatesDir()

5. **Run Full Test Suite:**
   ```bash
   npm test  # All 16 suites must pass
   npm run build  # Must build successfully
   ```

6. **Commit Message:**
   ```
   refactor(core): extract resolveTemplatesDir to shared utility

   Removed code duplication by extracting template directory resolution
   logic to shared utility function.

   Before: Duplicated in installer.ts, updater.ts, task-manager.ts
   After: Single implementation in src/utils/templates.ts

   Benefits:
   - Single source of truth
   - Easier maintenance
   - Better error messages
   - Testable in isolation

   No behavior changes - pure refactor.

   Fixes: Code Quality Issue #4 from quality report
   ```

**Verification Checklist:**
- [ ] New file `src/utils/templates.ts` exists
- [ ] Test file `tests/utils/templates.test.ts` exists
- [ ] No private `resolveTemplatesDir()` in core/ files
- [ ] All imports use `@/utils/templates.js`
- [ ] All tests pass
- [ ] Build succeeds

**DO NOT:**
- ❌ Change the resolution logic (keep same behavior)
- ❌ Leave any duplicate code
- ❌ Forget to delete the old methods
- ❌ Miss any call sites (`this.resolveTemplatesDir()`)
- ❌ Break the build

This is a **REFACTOR** - behavior must stay identical!
