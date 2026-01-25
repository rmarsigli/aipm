---
title: "Fix process.chdir() mutation in detector.ts"
created: 2026-01-25T18:30:00-03:00
last_updated: 2026-01-25T18:30:00-03:00
priority: P1-S
estimated_hours: 2
actual_hours: 0
status: backlog
blockers: []
tags: [critical, security, architecture, bug]
related_files:
  - src/core/detector.ts
  - src/config/frameworks.ts
  - tests/detector.test.ts
---

# Task: Fix process.chdir() Mutation in Framework Detection

## Objective

Remove dangerous `process.chdir()` usage from `src/core/detector.ts` that mutates global process state during framework detection. This causes concurrency issues, testing difficulties, and unpredictable behavior in async contexts.

**Success:**
- [ ] No `process.chdir()` calls in detector.ts
- [ ] Framework detection works for file-based frameworks (Rust/Cargo.toml)
- [ ] All existing tests pass
- [ ] No process state mutation during detection

## Context

**Why:**
Current implementation in `src/core/detector.ts:49-54` changes the process working directory to enable `fs.existsSync()` checks in framework detection:

```typescript
const match = FRAMEWORKS.find((sig: FrameworkConfig) => {
    const originalCwd = process.cwd()
    try {
        process.chdir(cwd)  // 🔴 DANGEROUS - mutates global state
        return sig.check(pkg || ({} as PackageJson))
    } finally {
        process.chdir(originalCwd)
    }
})
```

**Problems:**
1. **Concurrency Risk:** If multiple async operations call detectProject(), they interfere with each other
2. **Testing Issues:** Tests can't run in parallel, state pollution between tests
3. **Unexpected Failures:** If error thrown before finally block, cwd is wrong
4. **Code Smell:** Global state mutation is anti-pattern

**Why This Was Added:**
- Introduced in v1.3.0 to fix Rust detection (commit aeeb637)
- Rust framework uses `hasFile('Cargo.toml')` which checks relative to process.cwd()
- Quick fix that created bigger problem

**Dependencies:**
- None - can be fixed independently

**Related:**
- Quality Report: .project/reports/code-quality-analysis-2026-01-25.md (Issue #1)
- Previous commit: aeeb637 (introduced the issue)

## Implementation

### Phase 1: Update Framework Check Signature (Est: 0.5h)
- [ ] Read current `src/types/index.ts` to understand FrameworkConfig type
- [ ] Update `FrameworkConfig.check` signature to accept optional `cwd` parameter:
  ```typescript
  export interface FrameworkConfig {
      id: string
      name: string
      template: string
      check: (pkg: PackageJson, cwd?: string) => boolean  // Add cwd param
  }
  ```
- [ ] Document why cwd parameter is needed (for file-based detection)

### Phase 2: Update frameworks.ts (Est: 0.5h)
- [ ] Open `src/config/frameworks.ts`
- [ ] Update ALL framework check functions to use `cwd` parameter
- [ ] For package.json-based frameworks (React, Next, etc): ignore cwd parameter
- [ ] For file-based frameworks (Rust): use cwd for file checks

**Rust framework example:**
```typescript
{
    id: 'rust',
    name: 'Rust',
    template: 'rust',
    check: (pkg, cwd = process.cwd()) => {
        const cargoPath = path.join(cwd, 'Cargo.toml')
        const lockPath = path.join(cwd, 'Cargo.lock')
        return fs.existsSync(cargoPath) || fs.existsSync(lockPath)
    }
}
```

**Astro example (handles both file and package.json):**
```typescript
{
    id: 'astro',
    name: 'Astro',
    template: 'astro',
    check: (pkg, cwd = process.cwd()) => {
        if (hasDep(pkg, 'astro')) return true
        const configJs = path.join(cwd, 'astro.config.js')
        const configMjs = path.join(cwd, 'astro.config.mjs')
        return fs.existsSync(configJs) || fs.existsSync(configMjs)
    }
}
```

### Phase 3: Update detector.ts (Est: 0.5h)
- [ ] Open `src/core/detector.ts`
- [ ] Remove the try/catch/finally block with process.chdir()
- [ ] Simplify detectFramework() to pass cwd directly:

**Before:**
```typescript
function detectFramework(
    pkg: PackageJson | null,
    cwd: string
): { framework: string | null; frameworkVersion: string | null } {
    const match = FRAMEWORKS.find((sig: FrameworkConfig) => {
        const originalCwd = process.cwd()
        try {
            process.chdir(cwd)
            return sig.check(pkg || ({} as PackageJson))
        } finally {
            process.chdir(originalCwd)
        }
    })
    // ...
}
```

**After:**
```typescript
function detectFramework(
    pkg: PackageJson | null,
    cwd: string
): { framework: string | null; frameworkVersion: string | null } {
    // Simply pass cwd to check function - no state mutation!
    const match = FRAMEWORKS.find((sig: FrameworkConfig) => {
        return sig.check(pkg || ({} as PackageJson), cwd)
    })

    if (!match) return { framework: null, frameworkVersion: null }

    // For package.json-based frameworks, try to get version
    const version = pkg ? getDepVersion(pkg, match.id) || getDepVersion(pkg, match.id.split('-')[0]) : null

    return {
        framework: match.id,
        frameworkVersion: version
    }
}
```

### Phase 4: Update Tests (Est: 0.5h)
- [ ] Open `tests/detector.test.ts`
- [ ] Verify all existing tests still pass
- [ ] Add new test for Rust detection without chdir:
  ```typescript
  test('detects Rust project without changing cwd', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rust-test-'))
      await fs.writeFile(path.join(tempDir, 'Cargo.toml'), '[package]\nname = "test"')

      const originalCwd = process.cwd()
      const result = await detectProject(tempDir)

      expect(result.framework).toBe('rust')
      expect(process.cwd()).toBe(originalCwd)  // CWD unchanged!

      await fs.rm(tempDir, { recursive: true })
  })
  ```
- [ ] Run full test suite: `npm test`

## Definition of Done

### Functionality
- [ ] Framework detection works for all frameworks (React, Next, Rust, etc.)
- [ ] Rust/Cargo.toml detection works without chdir
- [ ] Node.js frameworks still detected via package.json
- [ ] Edge case: Empty package.json still checks file-based frameworks
- [ ] Error handling: Invalid paths don't crash detection

### Testing
- [ ] All existing tests pass (16 test suites)
- [ ] New test added for Rust detection
- [ ] Test verifies process.cwd() unchanged after detection
- [ ] Coverage maintained or improved

### Performance
- [ ] No performance regression (detection should be faster)
- [ ] No blocking operations added
- [ ] Async operations remain async

### Security
- [ ] No path traversal vulnerabilities
- [ ] No global state mutation
- [ ] Thread-safe for concurrent operations
- [ ] Safe for testing in parallel

### Code Quality
- [ ] No process.chdir() anywhere in detector.ts
- [ ] Type signature updated with JSDoc
- [ ] Grep confirms no other chdir usage: `grep -r "process.chdir" src/`
- [ ] Code is simpler and more readable

### Documentation
- [ ] Comment explaining why cwd parameter added to FrameworkConfig
- [ ] Update this task with actual_hours
- [ ] No ADR needed (bugfix, not architectural change)

### Git
- [ ] Single atomic commit
- [ ] Format: `fix(detector): remove dangerous process.chdir mutation`
- [ ] Body explains what was changed and why
- [ ] No merge conflicts

## Testing

### Unit Tests
```typescript
// Add to tests/detector.test.ts

test('detects Rust without mutating process.cwd()', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rust-test-'))
    await fs.writeFile(path.join(tempDir, 'Cargo.toml'), '[package]\nname = "test"')

    const originalCwd = process.cwd()
    const result = await detectProject(tempDir)

    expect(result.framework).toBe('rust')
    expect(process.cwd()).toBe(originalCwd)  // Must be unchanged!

    await fs.rm(tempDir, { recursive: true })
})

test('detects frameworks concurrently without interference', async () => {
    const results = await Promise.all([
        detectProject('/path/to/react-app'),
        detectProject('/path/to/rust-app'),
        detectProject('/path/to/next-app')
    ])

    // All should detect correctly despite running in parallel
    expect(results).toHaveLength(3)
})
```

### Manual Testing
- [ ] Create test Rust project with Cargo.toml
- [ ] Run `aipim install` in Rust project
- [ ] Verify Rust detected and offered in guidelines
- [ ] Run `aipim install` in Node.js project
- [ ] Verify React/Next/etc still detected
- [ ] Run detection twice rapidly (test concurrency)

## Blockers & Risks

**Current:**
- [ ] None - can be implemented immediately

**Potential:**
1. **Risk:** Breaking existing framework detection for file-based checks
   - **Mitigation:** Thorough testing with all framework types
   - **Test:** Run detector against sample projects for each framework

2. **Risk:** Tests depend on process.cwd() behavior
   - **Mitigation:** Update tests to pass explicit paths
   - **Action:** Review all tests in detector.test.ts

## Technical Notes

**Decisions:**
1. **Pass cwd to check() vs creating util function**
   - Chose: Pass cwd to check() (simpler, more explicit)
   - Reason: Each framework knows best how to detect itself
   - Alternative rejected: Central hasFile(filename, cwd) util (too indirect)

2. **Default cwd parameter to process.cwd()**
   - Makes framework checks work when called without cwd
   - Backwards compatible if check() called directly
   - Safe fallback for non-file-based frameworks

**Gotchas:**
- ⚠️ Must update ALL frameworks in FRAMEWORKS array, not just Rust
- ⚠️ Astro framework checks both package.json AND files - handle both
- ⚠️ Some frameworks use hasFile() helper - update helper to accept cwd

**Important Files:**
```typescript
// src/types/index.ts
export interface FrameworkConfig {
    id: string
    name: string
    template: string
    check: (pkg: PackageJson, cwd?: string) => boolean  // ADD CWD HERE
}

// src/config/frameworks.ts
const hasFile = (filename: string, cwd: string = process.cwd()): boolean => {
    return fs.existsSync(path.join(cwd, filename))
}

// Then use in frameworks:
check: (pkg, cwd) => hasFile('Cargo.toml', cwd) || hasFile('Cargo.lock', cwd)
```

## References

- Quality Report: `.project/reports/code-quality-analysis-2026-01-25.md` (Critical Issue #1)
- Previous Fix: Commit `aeeb637` (introduced the problem)
- Related: Rust detection feature added in v1.3.0

## Instructions for Gemini

**You are implementing a CRITICAL security/architecture fix. Follow these steps exactly:**

1. **Read First:**
   - `src/core/detector.ts` - understand current implementation
   - `src/config/frameworks.ts` - see all framework checks
   - `src/types/index.ts` - understand FrameworkConfig interface
   - `tests/detector.test.ts` - understand existing tests

2. **Modify in Order:**
   - Step 1: Update `FrameworkConfig` interface in types/index.ts
   - Step 2: Update ALL framework checks in config/frameworks.ts
   - Step 3: Simplify detectFramework() in core/detector.ts (remove chdir)
   - Step 4: Add test in tests/detector.test.ts
   - Step 5: Run `npm test` to verify

3. **Verify Before Committing:**
   - [ ] Run `grep -r "process.chdir" src/` - should find NO results
   - [ ] All 16 test suites pass
   - [ ] Build succeeds: `npm run build`
   - [ ] Lint passes: `npm run lint`

4. **Commit Message:**
   ```
   fix(detector): remove dangerous process.chdir mutation

   Replaced global process state mutation with explicit cwd parameter
   passing to framework check functions. Fixes concurrency issues and
   makes testing safer.

   - Updated FrameworkConfig.check signature to accept optional cwd
   - Modified all framework checks to use cwd parameter
   - Removed try/catch/finally block with process.chdir()
   - Added test verifying process.cwd() remains unchanged

   Fixes: Critical Issue #1 from quality report
   ```

**Quality Checklist:**
- [ ] Zero process.chdir() calls remain
- [ ] Code is SIMPLER than before (not more complex)
- [ ] All frameworks still detect correctly
- [ ] Tests prove concurrency safety
- [ ] Build and lint pass

**DO NOT:**
- ❌ Add complexity - solution should be simpler
- ❌ Skip updating any framework in FRAMEWORKS array
- ❌ Forget to update the type signature
- ❌ Leave console.log or debug statements
- ❌ Commit without running full test suite

This is a **CRITICAL** fix - take your time and test thoroughly.
