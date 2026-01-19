// Available template variables
export interface TemplateVariables {
    // Task context
    task_name: string
    task_objective_excerpt: string
    current_phase: string
    estimated_hours: string
    actual_hours: string
    completed_checkboxes: string
    total_checkboxes: string
    last_completed_checkbox: string
    next_uncompleted_checkbox: string

    // Git context
    current_file: string
    current_branch: string
    git_log_today: string
    git_diff_stat: string

    // Session context
    session_number: string
    last_commit: string

    // User preferences
    skill_level: 'beginner' | 'intermediate' | 'advanced'
}

export const VARIABLE_DESCRIPTIONS: Record<keyof TemplateVariables, string> = {
    task_name: 'Name of the current active task',
    task_objective_excerpt: 'First few lines of the task objective',
    current_phase: 'Current active phase of the task',
    estimated_hours: 'Estimated hours for the task',
    actual_hours: 'Actual hours spent so far',
    completed_checkboxes: 'Number of completed items',
    total_checkboxes: 'Total number of items',
    last_completed_checkbox: 'Most recently completed item',
    next_uncompleted_checkbox: 'Next item to complete',
    current_file: 'Currently open file (if available)',
    current_branch: 'Current git branch',
    git_log_today: 'List of commits made today',
    git_diff_stat: 'Statistics of uncommitted changes',
    session_number: 'Current AIPIM session number',
    last_commit: 'Hash and message of the last commit',
    skill_level: 'Developer skill level for explanation depth'
}
