---
title: "Implement Large Task Auto-Breakdown Protocol"
created: 2026-01-18T15:52:00-03:00
last_updated: 2026-01-18T15:52:00-03:00
priority: P2-M
estimated_hours: 4
actual_hours: 0
status: backlog
blockers: []
tags: [template, automation, task-management]
related_files: [src/templates/base/project-manager.md]
---

# Task: Implement Large Task Auto-Breakdown Protocol

## Objective

Add protocol to agent guidelines that automatically breaks down large tasks (>12h estimated) into smaller, manageable sub-tasks with individual checkpoints and commits.

**Success:**
- [ ] Agent detects tasks >12h and prompts breakdown
- [ ] Sub-tasks follow standard phase structure (max 4-6h each)
- [ ] Each phase is treated as mini-task with commits
- [ ] Large tasks become more trackable and less likely to stall

## Context

**Why:** Large tasks (>12h) often stall midway because progress is hard to track, checkpoints are unclear, and commits become too large. Breaking them automatically reduces risk.

**Dependencies:**
- [ ] None

**Related:** Complements existing task management workflow

## Implementation

### Phase 1: Add Detection Logic to Guidelines (Est: 2h)
- [ ] Add section to `src/templates/base/project-manager.md`:
  ```markdown
  ## MANDATORY: Large Task Auto-Breakdown

  When starting task with estimated_hours > 12:
  1. Analyze complexity and break into 3-5 phases
  2. Each phase: 2-6 hours max
  3. Create phase checklist in current-task.md
  4. Treat each phase as mini-task (commit after completion)
  ```
- [ ] Define clear phase breakdown criteria:
  - Setup/scaffolding (usually 1-2h)
  - Core implementation (4-6h)
  - Testing (2-3h)
  - Documentation/polish (1-2h)

### Phase 2: Add Phase Template Examples (Est: 1h)
- [ ] Create example breakdown in documentation
- [ ] Show before/after task structure
- [ ] Provide phase naming conventions

### Phase 3: Add Validation (Est: 1h)
- [ ] Update validation script to check:
  - Tasks >12h have phase breakdown
  - Sum of phase estimates matches total estimate
  - Each phase has clear deliverables

## Definition of Done

### Functionality
- [ ] Protocol clearly documented in guidelines
- [ ] Detection threshold configurable (default 12h)
- [ ] Phase structure template provided
- [ ] Examples show real breakdown scenarios

### Testing
- [ ] Create sample 20h task
- [ ] Verify AI breaks it into phases correctly
- [ ] Check phase estimates sum to total
- [ ] Validate commits happen per-phase

### Code Quality
- [ ] Clear documentation
- [ ] No ambiguous instructions
- [ ] Examples are realistic

### Documentation
- [ ] Time logged
- [ ] Update docs/task-management.md
- [ ] Add breakdown examples

### Git
- [ ] Atomic commits
- [ ] Convention: feat(templates): add large task breakdown protocol
- [ ] No conflicts

## Testing

### Manual
- [ ] Install AIPIM in test project
- [ ] Create task with 18h estimate
- [ ] Verify AI prompts for breakdown
- [ ] Check phases are created correctly
- [ ] Complete one phase, verify commit happens

## Blockers & Risks

**Current:**
- [ ] None

**Potential:**
1. Risk: AI might break tasks too granularly - Mitigation: Set min 2h per phase
2. Risk: Phase estimates might not sum correctly - Mitigation: Add validation check

## Technical Notes

**Decisions:**
1. Use 12h as threshold (can be adjusted per project)
2. Phases are in same current-task.md (not separate files)
3. Each phase completion triggers commit

**Example Breakdown:**

Before:
```yaml
title: "Implement Oracle Profiling System"
estimated_hours: 18
```

After:
```markdown
### Phase 1: Setup & Schema (3h)
- [ ] Define profile schema
- [ ] Create PostgreSQL tables
- [ ] Write migrations

### Phase 2: Core Metrics (6h)
- [ ] Implement tactical pattern detection
- [ ] Add confidence scoring
- [ ] Create aggregation logic

### Phase 3: Testing (5h)
- [ ] Unit tests for metrics
- [ ] Integration tests with sample games
- [ ] Edge case handling

### Phase 4: Documentation (4h)
- [ ] API docs
- [ ] README updates
- [ ] Example usage
```

## References

- Agile story splitting techniques
- User feedback on large task management pain points

## Completion

- [ ] All DoD checked
- [ ] Time logged
- [ ] Context updated
- [ ] Documentation complete
