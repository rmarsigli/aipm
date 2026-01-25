---
title: "Add path validation to all user input handlers"
created: 2026-01-25T18:35:00-03:00
last_updated: 2026-01-25T18:35:00-03:00
priority: P1-M
estimated_hours: 2
actual_hours: 0
status: backlog
blockers: []
tags: [critical, security, path-traversal, validation]
related_files:
  - src/commands/pause.ts
  - src/commands/template.ts
  - src/utils/path-validator.ts
  - tests/security/path-validation.test.ts
---

# Task: Add Path Validation to All User Input Handlers

## Objective

Add comprehensive path validation to commands that handle user-provided file paths, fixing critical security vulnerability where path traversal attacks could escape project boundaries.

**Success:**
- [ ] All user-provided paths validated before use
- [ ] Symlink attacks prevented with `validatePathSafe()`
- [ ] No path traversal vulnerabilities remain
- [ ] Security tests added and passing

## Context

**Why:**
Multiple commands construct file paths from user input WITHOUT validation, creating path traversal vulnerabilities:

**Vulnerable Code Locations:**

1. **pause.ts:16** - Snapshot file path from timestamp
```typescript
const snapshotFile = join(snapshotsDir, `pause-${timestamp}.json`)  // ❌ No validation
```

2. **template.ts:88-89** - Custom template paths
```typescript
const customPath = join(userTemplatesDir, name + '.md')  // ❌ No validation
if (existsSync(customPath)) {
    templatePath = customPath  // ❌ Could be symlink to /etc/passwd
}
```

3. **template.ts:167** - Output file path from template name
```typescript
const filePath = join(projectRoot, name + '.md')  // ❌ No validation
```

**Attack Vector Example:**
```bash
# Attacker could create template with malicious name
aipim template use "../../../etc/passwd"  # Tries to read system file

# Or create symlink attack
ln -s /etc/passwd ~/.config/aipim/templates/malicious.md
aipim template use malicious  # Could expose sensitive data
```

**Why This Matters:**
- AIPIM runs with user's permissions - could access ANY file user can read
- Template system allows custom user templates (attack vector)
- Snapshot/pause feature creates files in predictable locations

**Dependencies:**
- `validatePath()` and `validatePathSafe()` already exist in `src/utils/path-validator.ts`
- Just need to USE them consistently

**Related:**
- Quality Report: .project/reports/code-quality-analysis-2026-01-25.md (Critical Issue #2)
- Security tests already exist: tests/security/path-validation.test.ts

## Implementation

### Phase 1: Fix pause.ts (Est: 0.5h)
- [ ] Open `src/commands/pause.ts`
- [ ] Import validatePath: `import { validatePath } from '@/utils/path-validator.js'`
- [ ] Locate line 16 where snapshotFile is created
- [ ] Add validation BEFORE using the path:

**Before:**
```typescript
const snapshotsDir = join(projectRoot, '.project/.snapshots')
await ensureDir(snapshotsDir)
const snapshotFile = join(snapshotsDir, `pause-${timestamp}.json`)
```

**After:**
```typescript
const snapshotsDir = join(projectRoot, '.project/.snapshots')
await ensureDir(snapshotsDir)

// Validate snapshot directory is within project
const validatedSnapshotsDir = validatePath(snapshotsDir, projectRoot)

const snapshotFile = join(validatedSnapshotsDir, `pause-${timestamp}.json`)
// Validate final snapshot file path
const validatedSnapshotFile = validatePath(snapshotFile, projectRoot)
```

- [ ] Update all references to use `validatedSnapshotFile`
- [ ] Add error handling for validation failure

### Phase 2: Fix template.ts Custom Paths (Est: 0.5h)
- [ ] Open `src/commands/template.ts`
- [ ] Import validatePathSafe: `import { validatePath, validatePathSafe } from '@/utils/path-validator.js'`
- [ ] Locate lines 88-89 (custom template path construction)
- [ ] Add validation with symlink check:

**Before:**
```typescript
const customPath = join(userTemplatesDir, name + '.md')
if (existsSync(customPath)) {
    templatePath = customPath
}
```

**After:**
```typescript
try {
    // Sanitize template name first (remove path separators)
    const sanitizedName = name.replace(/[\/\\]/g, '-')
    const customPath = join(userTemplatesDir, sanitizedName + '.md')

    // Validate path and check for symlink attacks
    const validatedPath = validatePathSafe(customPath, userTemplatesDir)

    if (existsSync(validatedPath)) {
        templatePath = validatedPath
    }
} catch (error) {
    // Path validation failed - template not safe to use
    logger.warn(`Custom template "${name}" failed security validation`)
    // Continue to check default templates
}
```

### Phase 3: Fix template.ts Output Paths (Est: 0.5h)
- [ ] Still in `src/commands/template.ts`
- [ ] Locate line 167 (output file path construction)
- [ ] Add validation before file creation:

**Before:**
```typescript
const name = await input({
    message: 'Template name:',
    validate: (value: string) => value.length > 0 || 'Name required'
})

const filePath = join(projectRoot, name + '.md')
```

**After:**
```typescript
const name = await input({
    message: 'Template name:',
    validate: (value: string) => {
        if (value.length === 0) return 'Name required'
        // Prevent path separators in template name
        if (value.includes('/') || value.includes('\\')) {
            return 'Template name cannot contain path separators'
        }
        // Prevent hidden files
        if (value.startsWith('.')) {
            return 'Template name cannot start with dot'
        }
        return true
    }
})

// Double sanitize (defense in depth)
const sanitizedName = name.replace(/[\/\\]/g, '-').replace(/^\.+/, '')
const filePath = join(projectRoot, sanitizedName + '.md')

// Validate output path
const validatedPath = validatePath(filePath, projectRoot)
```

### Phase 4: Add Security Tests (Est: 0.5h)
- [ ] Open or create `tests/security/path-validation.test.ts`
- [ ] Add tests for each vulnerable location:

```typescript
import { pause } from '@/commands/pause.js'
import { template } from '@/commands/template.js'
import path from 'path'
import fs from 'fs-extra'

describe('Path Validation Security', () => {
    test('pause command rejects path traversal in snapshot name', async () => {
        const maliciousTimestamp = '../../../etc/passwd'

        await expect(async () => {
            // This should fail validation, not create file outside project
            await pause({ reason: 'test' })
        }).rejects.toThrow()

        // Verify no file created outside project
        expect(fs.existsSync('/etc/passwd-snapshot')).toBe(false)
    })

    test('template command rejects path traversal in template name', async () => {
        const maliciousName = '../../../etc/passwd'

        await expect(async () => {
            await template({ name: maliciousName })
        }).rejects.toThrow(/path.*validation|security/i)
    })

    test('template command rejects symlink attacks', async () => {
        const tempDir = await fs.mkdtemp('/tmp/test-')
        const templatesDir = path.join(tempDir, 'templates')
        await fs.ensureDir(templatesDir)

        // Create symlink pointing outside templates dir
        const symlinkPath = path.join(templatesDir, 'malicious.md')
        await fs.symlink('/etc/passwd', symlinkPath)

        // Should detect and reject symlink
        await expect(async () => {
            // Load template would try to follow symlink
            const content = await fs.readFile(symlinkPath, 'utf-8')
        }).rejects.toThrow()

        await fs.rm(tempDir, { recursive: true })
    })

    test('template name validation prevents path separators', async () => {
        const maliciousNames = [
            '../escape',
            'sub/directory',
            '..\\windows\\path',
            '.hidden',
            '///absolute'
        ]

        for (const name of maliciousNames) {
            // Input validation should catch these
            expect(() => validateTemplateName(name)).toThrow()
        }
    })
})
```

## Definition of Done

### Functionality
- [ ] All user-provided paths validated before use
- [ ] Path traversal attacks blocked (../, /absolute paths)
- [ ] Symlink attacks blocked (validatePathSafe)
- [ ] Error messages helpful: "Invalid path: security validation failed"
- [ ] Edge cases handled: Windows paths, unicode, special chars

### Testing
- [ ] New security tests added (4+ test cases)
- [ ] All existing tests still pass
- [ ] Manual penetration testing performed
- [ ] Coverage for path validation code >90%

### Performance
- [ ] Validation adds <1ms overhead per path
- [ ] No performance regression in hot paths
- [ ] Cached validation not needed (fast enough)

### Security
- [ ] ✅ Path traversal prevented (../ blocked)
- [ ] ✅ Absolute paths rejected when expecting relative
- [ ] ✅ Symlinks validated with validatePathSafe()
- [ ] ✅ Input sanitized before path construction
- [ ] ✅ Defense in depth: validation + sanitization
- [ ] ✅ No file access outside project boundaries

### Code Quality
- [ ] Validation added consistently across all commands
- [ ] Error handling includes helpful context
- [ ] No console.log - use logger.error()
- [ ] Import statements organized

### Documentation
- [ ] Comment explaining why validation needed
- [ ] Security section in CONTRIBUTING.md updated
- [ ] Time logged in this task

### Git
- [ ] Single atomic commit
- [ ] Format: `fix(security): add path validation to prevent traversal attacks`
- [ ] Body lists all locations fixed
- [ ] Reference security issue in report

## Testing

### Security Tests (Penetration Testing)
```bash
# Test 1: Path traversal in template name
aipim template use "../../../etc/passwd"
# Expected: Error about invalid path, no file access

# Test 2: Path traversal in snapshot
# (Harder to test - requires modifying timestamp)

# Test 3: Symlink attack
mkdir -p ~/.config/aipim/templates
ln -s /etc/passwd ~/.config/aipim/templates/malicious.md
aipim template use malicious
# Expected: Symlink validation error

# Test 4: Absolute path
aipim template use "/etc/passwd"
# Expected: Validation error

# Test 5: Windows-style paths
aipim template use "C:\\Windows\\System32\\config\\SAM"
# Expected: Validation error
```

### Automated Tests
Run: `npm test -- --testNamePattern="Path Validation Security"`

### Manual Verification
- [ ] Try to escape project with ../ in all commands
- [ ] Try to use absolute paths where relative expected
- [ ] Create symlink and try to follow it
- [ ] Verify error messages are clear and helpful

## Blockers & Risks

**Current:**
- [ ] None - validation utilities already exist

**Potential:**
1. **Risk:** Breaking existing valid use cases
   - **Mitigation:** Test with real projects, multiple OSes
   - **Action:** Run full E2E test suite

2. **Risk:** Error messages confuse users
   - **Mitigation:** Clear error text explaining security reason
   - **Example:** "Template name cannot contain path separators for security reasons"

3. **Risk:** Windows path handling different
   - **Mitigation:** validatePath already handles Windows
   - **Action:** Test on Windows or WSL

## Technical Notes

**Validation Functions Available:**

```typescript
// src/utils/path-validator.ts

// Validates path is within basePath (no traversal)
export function validatePath(targetPath: string, basePath?: string): string

// validatePath + symlink check
export function validatePathSafe(targetPath: string, basePath: string): string

// Throws SecurityError if validation fails
export class SecurityError extends Error {
    constructor(message: string)
}
```

**Best Practices:**
1. **Sanitize THEN validate:** Remove dangerous chars, then check path
2. **Use validatePathSafe for user templates:** Symlink risk higher
3. **Use validatePath for generated paths:** System controls them
4. **Validate BEFORE fs operations:** Don't check after creating file

**Defense in Depth:**
```typescript
// Layer 1: Input validation
if (name.includes('/')) throw new Error('Invalid name')

// Layer 2: Sanitization
const sanitized = name.replace(/[\/\\]/g, '-')

// Layer 3: Path validation
const validated = validatePath(join(dir, sanitized), dir)

// Layer 4: Symlink check (if user-provided)
const safe = validatePathSafe(validated, dir)
```

## References

- Security Utils: `src/utils/path-validator.ts`
- Existing Tests: `tests/security/path-validation.test.ts`
- Quality Report: `.project/reports/code-quality-analysis-2026-01-25.md` (Issue #2)
- OWASP Path Traversal: https://owasp.org/www-community/attacks/Path_Traversal

## Instructions for Gemini

**You are fixing a SECURITY VULNERABILITY. Be extremely careful.**

1. **Read Security Code First:**
   - `src/utils/path-validator.ts` - understand validation functions
   - `tests/security/path-validation.test.ts` - see existing tests
   - Review each vulnerable location in pause.ts and template.ts

2. **Fix in Order (Important!):**
   - Step 1: Fix pause.ts snapshot paths (simpler)
   - Step 2: Fix template.ts custom paths (use validatePathSafe)
   - Step 3: Fix template.ts output paths (add input validation)
   - Step 4: Add security tests
   - Step 5: Run penetration tests manually

3. **Validation Pattern:**
   ```typescript
   // ALWAYS this order:
   import { validatePath, validatePathSafe } from '@/utils/path-validator.js'

   // 1. Sanitize input
   const clean = userInput.replace(/[\/\\]/g, '-')

   // 2. Construct path
   const fullPath = path.join(baseDir, clean + '.md')

   // 3. Validate (use Safe for user files)
   const safe = validatePathSafe(fullPath, baseDir)

   // 4. Use validated path
   await fs.writeFile(safe, content)
   ```

4. **Testing Requirements:**
   - [ ] Add 4+ security test cases
   - [ ] Test path traversal attempts (../)
   - [ ] Test symlink attacks
   - [ ] Test absolute paths
   - [ ] All tests must PASS before committing

5. **Commit Message:**
   ```
   fix(security): add path validation to prevent traversal attacks

   Added comprehensive path validation to all user input handlers:
   - pause.ts: Validate snapshot file paths
   - template.ts: Validate custom template paths with symlink check
   - template.ts: Validate output file paths with input sanitization

   Prevents path traversal attacks (../) and symlink attacks that could
   access files outside project boundaries.

   Security tests added to verify:
   - Path traversal blocked
   - Symlinks rejected
   - Absolute paths rejected
   - Special characters sanitized

   Fixes: Critical Security Issue #2 from quality report
   ```

**CRITICAL Checklist:**
- [ ] Every user input path has validation
- [ ] Use validatePathSafe() for user-provided files
- [ ] Sanitize input BEFORE constructing paths
- [ ] Security tests added and passing
- [ ] Try to break it yourself (penetration test)

**DO NOT:**
- ❌ Skip validation on "probably safe" paths
- ❌ Validate after fs operation (too late!)
- ❌ Use validatePath where validatePathSafe needed
- ❌ Commit without running security tests
- ❌ Leave debug code or console.logs

This is a **SECURITY FIX** - test thoroughly with malicious inputs!
