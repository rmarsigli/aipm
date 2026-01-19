# Basic Usage Guide

**See also:**
- [CLI Reference](https://github.com/rmarsigli/aipim/blob/main/docs/cli-reference.md) - Full command manual
- [Advanced Usage](https://github.com/rmarsigli/aipim/blob/main/docs/advanced-usage.md) - Scripts & Power Flows
- [Troubleshooting](https://github.com/rmarsigli/aipim/blob/main/docs/troubleshooting.md) - Fixes for common issues

## Getting Started

1.  **Start a session:**
    ```bash
    aipim start
    ```
    > Copies context prompt. Paste into AI.

2.  **Resume work:**
    ```bash
    aipim resume
    ```

## Daily Workflow

1.  **Pick a task:**
    ```bash
    # Check dependencies first
    aipim deps
    
    # Move from backlog to current work
    mv .project/backlog/T001-setup.md .project/current-task.md
    ```

2.  **Work on it:**
    -   Update checkboxes in `current-task.md`.
    -   Log progress daily (see [Advanced Usage](https://github.com/rmarsigli/aipim/blob/main/docs/advanced-usage.md#velocity-tracking)).

3.  **Complete it:**
    ```bash
    mv .project/current-task.md .project/completed/$(date +%Y-%m-%d)-T001-setup.md
    ```

## Need Help?
-   Emergency stop? `aipim pause` (see [CLI Reference](https://github.com/rmarsigli/aipim/blob/main/docs/cli-reference.md#aipim-pause))
-   Found a bug? See [Advanced Usage](https://github.com/rmarsigli/aipim/blob/main/docs/advanced-usage.md#pain-driven-tasks) for "Pain-Driven Development".
-   Stuck? Check [Troubleshooting](https://github.com/rmarsigli/aipim/blob/main/docs/troubleshooting.md).

