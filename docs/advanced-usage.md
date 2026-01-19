# Advanced Usage Guide

Power-user workflows and utility scripts for maximum productivity.

## Helper Scripts

### 1. Velocity Tracking (`task-velocity.sh`)
**Purpose:** Calculate detailed progress metrics for multi-day tasks.
**Usage:**
```bash
.project/scripts/task-velocity.sh
```
**Prerequisite:** Ensure your `current-task.md` has a "Progress Log" section populated daily.

### 2. Pain-Driven Tasks (`pain-to-tasks.sh`)
**Purpose:** Convert "Pain Points" listed in `current-task.md` into concrete backlog items.
**Usage:**
```bash
.project/scripts/pain-to-tasks.sh
```
**Workflow:**
1.  Add annoyances to `## Pain Points` in your current task.
2.  Run script.
3.  Prioritize the new tasks in `.project/backlog`.

### 3. Code Quality Analysis (`analyze-quality.sh`)
**Purpose:** Generate a prompt for the AI to perform a rigorous code quality review.
**Usage:**
```bash
.project/scripts/analyze-quality.sh --manual
```
**Output:** A prompt to paste into your AI chat, asking for a review based on project standards.

## Design Patterns

### Feature-First Documentation
**Concept:** Write the documentation *before* the code to guide the AI and save tokens.

**Steps:**
1.  **Create Doc:**
    ```bash
    cp .project/docs/features/feature-template.md .project/docs/features/my-feature.md
    ```
2.  **Define Logic:** detailed rules, edge cases, and user stories.
3.  **Implement:** Tell AI "Implement based on .project/docs/features/my-feature.md".

**Benefits:**
-   Clearer requirements.
-   Less conversational back-and-forth.
-   Higher code quality.
