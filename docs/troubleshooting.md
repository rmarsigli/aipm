# Troubleshooting Guide

Common issues and solutions when using AIPIM.

## Git Issues

### "Conflict during resume"
**Symptom:** `aipim resume` fails to pop the stash due to conflicts.
**Solution:**
1.  Manually resolve conflicts in your editor.
2.  Stage resolved files: `git add .`
3.  Drop the stash manually if needed: `git stash drop`

## Task Issues

### "Circular Dependencies Detected"
**Symptom:** `aipim deps` shows an error about cycles.
**Cause:** Task A depends on B, and B depends on A.
**Solution:**
1.  Edit the frontmatter of the affected tasks in `.project/backlog`.
2.  Remove the offending `depends_on` entry.

### "Task not found"
**Symptom:** Commands cannot find your current task.
**Solution:**
Ensure your task file is exactly at `.project/current-task.md`.

## CLI Issues

### "Command not found: aipim"
**Solution:**
Ensure you have linked the package locally or installed it globally.
```bash
npm link
# or
npm install -g .
```

### Permission Denied (Scripts)
**Symptom:** `.project/scripts/xyz.sh: Permission denied`
**Solution:**
Make the script executable:
```bash
chmod +x .project/scripts/*.sh
```
