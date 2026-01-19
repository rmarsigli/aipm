---
title: "Fix package.json URLs (aipm → aipim)"
created: 2026-01-19T02:00:00-03:00
completed: 2026-01-19T04:10:00-03:00
priority: P1-S
estimated_hours: 0.25
actual_hours: 0.25
status: completed
blockers: []
tags: [bugfix, naming, urgent]
related_files: [package.json]
---

# Task: Fix package.json URLs (T016)

## Objective

Correct typo in package.json where repository/homepage/bugs URLs reference `aipm` instead of `aipim`.

**Success:**
- [x] All URLs in package.json point to correct repository (`aipim`, not `aipm`)
- [x] No references to old naming remain in package metadata

## Context

**Why:** Quality report identified naming inconsistency. Package points to wrong GitHub repository.

**Impact:** Users clicking on npm package links get 404 errors. Breaks "Report Issue" workflow.

**Related:** Code Quality Analysis Report 2026-01-19, ADR-004 (Standardize Naming)

## Implementation

### Single Phase (Est: 0.25h = 15min)
- [x] Open package.json
- [x] Find all URL fields (homepage, bugs.url, repository.url)
- [x] Replace `aipm` with `aipim` in URLs
- [x] Verify no other metadata references wrong name
- [x] Commit change

## Definition of Done

### Functionality
- [x] Works as specified
- [x] All URLs resolve correctly (manual check on GitHub)
- [x] npm package.json valid (no JSON errors)

### Testing
- [x] Manual verification: click all URLs in package.json
- [x] `pnpm install` still works
- [x] No broken links

### Security
- [x] N/A (metadata only)

### Code Quality
- [x] JSON properly formatted
- [x] No typos remain

### Documentation
- [x] Time logged
- [x] No ADR needed (trivial fix)
- [x] README unchanged (uses correct name already)

### Git
- [x] Atomic commit
- [x] Convention: `fix(pkg): correct repository URLs from aipm to aipim`
- [x] No conflicts

## Testing

### Manual
- [x] Visit https://github.com/rmarsigli/aipim (should exist)
- [x] Visit old URL https://github.com/rmarsigli/aipm (confirm it 404s or redirects)
- [x] Check npm registry after publish (links correct)

## Blockers & Risks

**Current:**
- [x] None

**Potential:**
1. Risk: Old name might be hardcoded elsewhere - Mitigation: Grep for `aipm` after fix

## Progress

### Time Log
| Date | Hours | Activity |
|------|-------|----------|
| | 0 | Not started |

**Total:** 0h / 0.25h

## Technical Notes

**Files to change:**
```json
// package.json
{
  "homepage": "https://github.com/rmarsigli/aipim",  // was aipm
  "bugs": {
    "url": "https://github.com/rmarsigli/aipim/issues"  // was aipm
  },
  "repository": {
    "url": "https://github.com/rmarsigli/aipim"  // was aipm
  }
}
```

**Grep command to verify:**
```bash
grep -r "aipm" package.json README.md CHANGELOG.md
```

## References

- Code Quality Analysis Report: `.project/reports/code-quality-analysis-2026-01-19.md`
- ADR-004: Standardize naming (aipim not aipm)

## Retrospective (Post-completion)

**Went well:**
-

**Improve:**
-

**Estimate:**
- Est: 0.25h, Actual: ___h, Diff: ___%

**Lessons:**
1.

## Completion

- [x] All DoD checked
- [x] Time logged
- [x] Retrospective done
- [x] Context updated
- [x] Git merged/ready
- [x] Validation passed

**Completed:** ___________
**Final time:** _____ hours
