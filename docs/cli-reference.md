# CLI Reference Guide

Comprehensive manual for the `aipim` command-line interface.

## Core Commands

### `aipim start`
**Description:** Starts a new AI coding session by generating a context-rich prompt.
**Usage:** `aipim start [options]`

**Options:**
- `--print`: Print prompt to terminal instead of copying to clipboard.
- `--file <path>`: Save prompt to a file.
- `--full`: Include extended context (10 commits, all ADRs).

**Example:**
```bash
aipim start --print
```

### `aipim resume`
**Description:** Resumes an interrupted or previous session context.
**Usage:** `aipim resume [options]`

**Options:**
- `--auto`: Skip interactive confirmation prompt.

**Example:**
```bash
aipim resume
```

### `aipim pause`
**Description:** Pauses the current session, saving context and stashing incomplete work.
**Usage:** `aipim pause --reason "<reason>"`

**Options:**
- `-r, --reason <text>`: (Required) Reason for the interruption.

**Example:**
```bash
aipim pause --reason "Meeting"
```

## Task Management

### `aipim deps`
**Description:** Visualizes the task dependency graph and highlights blocked tasks.
**Usage:** `aipim deps`

**Example:**
```bash
aipim deps
```

## System Commands

### `aipim install`
**Description:** Installs AIPIM configuration in the current directory.
**Options:**
- `-p, --preset <name>`: Use a preset (e.g., `feature-rich`).
- `--compact`: Use compact mode (default).

### `aipim update`
**Description:** Updates the local AIPIM configuration from the installation source.
**Options:**
- `-f, --force`: Overwrite local customizations.

### `aipim validate`
**Description:** Checks if the current setup is valid and healthy.

### `aipim diff`
**Description:** Shows changes between local configuration and the latest version.
