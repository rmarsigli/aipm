I need to work on the next task from the backlog.

**Context:**
- We've completed {{completed_tasks_count}} tasks so far
- Current session: {{session_number}}
- Branch: {{current_branch}}

**Task to work on:**
{{task_file_name}}

**Instructions (MANDATORY):**

1. **Read guidelines first:**
   - Read GEMINI.md (or CLAUDE.md) - contains MANDATORY project guidelines
   - Read .project/context.md - current session state
   - Read .project/backlog/{{task_file_name}} - full task details

2. **Before starting:**
   - Understand the task requirements completely
   - Check if there are any blockers
   - Verify all dependencies are ready

3. **Quality gates (check ALL before completing):**
   - [ ] All tests passing
   - [ ] No lint warnings
   - [ ] Definition of Done satisfied
   - [ ] Code clean (no debug code, console.logs, TODOs)

4. **Git commit (ONE atomic commit):**
   - Format: `type(scope): description` (single line only)
   - Example: `feat(auth): implement login endpoint`
   - NO multi-line commits

5. **Context awareness:**
   - When context is running low (>70% used): WARN me explicitly
   - DO NOT continue to next task if context is low
   - Better to pause and resume fresh than rush

6. **Session integrity:**
   - Complete this task fully before moving to next
   - One task = one complete cycle (start → code → test → commit)

**Ready?** Please confirm you've read the guidelines and task details, then begin working on the task.
