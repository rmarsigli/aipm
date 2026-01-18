---
title: "Add Session Metrics Tracking to Context.md"
created: 2026-01-18T15:50:00-03:00
last_updated: 2026-01-18T15:50:00-03:00
priority: P2-M
estimated_hours: 6
actual_hours: 0
status: backlog
blockers: []
tags: [template, automation, metrics]
related_files: [src/templates/base/project-manager.md, src/templates/base/.project/_templates/context-template.md]
---

# Task: Add Session Metrics Tracking to Context.md

## Objective

Add automatic session metrics tracking to the context.md template, enabling AI agents to track and report productivity trends, blockers, and code quality metrics over time.

**Success:**
- [ ] Context template includes metrics section
- [ ] AI agent guidelines include metrics update protocol
- [ ] Metrics are auto-calculated from session data
- [ ] Weekly/monthly trend reports are generated

## Context

**Why:** Users want visibility into productivity, velocity trends, and recurring blockers. Manual tracking is tedious and often skipped.

**Dependencies:**
- [ ] None

**Related:** Improves session end protocol from recent GEMINI.md/CLAUDE.md updates

## Implementation

### Phase 1: Update Context Template (Est: 2h)
- [ ] Add metrics section to `src/templates/base/.project/_templates/context-template.md`
- [ ] Include fields:
  - Tasks completed this week/month
  - Average actual vs estimated hours ratio
  - Most common blocker types
  - Velocity trend (improving/stable/declining)
  - Code quality trends (test coverage, clippy warnings)
- [ ] Define metric calculation formulas in comments

### Phase 2: Update Agent Guidelines (Est: 2h)
- [ ] Add "Metrics Tracking Protocol" to `src/templates/base/project-manager.md`
- [ ] Instruct AI to update metrics:
  - After completing each task
  - Weekly on Fridays (auto-generate report)
  - Monthly on last Friday
- [ ] Provide example metrics update format

### Phase 3: Add Metric Calculation Helpers (Est: 2h)
- [ ] Create optional script: `.project/scripts/calculate-metrics.sh`
- [ ] Parse completed tasks to extract:
  - estimated_hours vs actual_hours
  - completion dates
  - blocker frequency
- [ ] Output formatted metrics for context.md

## Definition of Done

### Functionality
- [ ] Context template has complete metrics section
- [ ] Agent guidelines include clear metrics protocol
- [ ] Example metrics shown in template
- [ ] Script can parse task files and calculate metrics

### Testing
- [ ] Test with sample completed tasks
- [ ] Verify metrics calculation accuracy
- [ ] Test weekly/monthly report generation
- [ ] Coverage >80% for calculation logic

### Code Quality
- [ ] ESLint clean
- [ ] TypeScript strict mode passes
- [ ] Well-documented calculation formulas
- [ ] Clean variable names

### Documentation
- [ ] Time logged
- [ ] Update docs/basic-usage.md with metrics section
- [ ] Add examples in docs/examples/

### Git
- [ ] Atomic commits
- [ ] Convention: feat(templates): add session metrics tracking
- [ ] No conflicts

## Testing

### Manual
- [ ] Install AIPIM in test project
- [ ] Complete 2-3 sample tasks
- [ ] Run metrics calculation
- [ ] Verify context.md metrics accuracy
- [ ] Generate weekly report

## Blockers & Risks

**Current:**
- [ ] None

**Potential:**
1. Risk: Metrics might be inaccurate if tasks aren't properly filled - Mitigation: Validate task frontmatter on completion

## Technical Notes

**Decisions:**
1. Use bash script for metrics (simple, cross-platform)
2. Metrics are optional enhancement (won't break existing projects)

**Gotchas:**
- ⚠️ Parsing YAML frontmatter in bash is tricky - use `yq` or simple grep
- ⚠️ Need to handle tasks without actual_hours gracefully

**Code Pattern:**
```bash
# Calculate average estimate accuracy
total_estimated=0
total_actual=0
for task in .project/completed/*.md; do
  estimated=$(grep -oP 'estimated_hours: \K\d+' "$task")
  actual=$(grep -oP 'actual_hours: \K\d+' "$task")
  total_estimated=$((total_estimated + estimated))
  total_actual=$((total_actual + actual))
done
ratio=$(echo "scale=2; $total_actual / $total_estimated" | bc)
```

## References

- Original suggestion in session with user
- Example metrics formats from Jira, Linear

## Completion

- [ ] All DoD checked
- [ ] Time logged
- [ ] Context updated
- [ ] Tests pass
- [ ] Documentation updated
