import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { TemplateVariables } from '../prompts/templates/variables.js'
import { parseContext, parseTask, getCurrentBranch } from './context.js'

export function getTemplateVariables(projectDir: string, cwd: string): Record<string, string> {
    const variables: Partial<TemplateVariables> = {}

    // 1. Task Context
    const taskPath = join(projectDir, 'current-task.md')
    if (existsSync(taskPath)) {
        try {
            const taskContent = readFileSync(taskPath, 'utf-8')
            const task = parseTask(taskContent)

            variables.task_name = task.title
            variables.estimated_hours = task.estimated_hours
            variables.actual_hours = task.actual_hours
            variables.current_phase = task.currentPhase || 'N/A'

            // Extract objective excerpt (first paragraph of description)
            const objectiveMatch = taskContent.match(/## Objective\s+([\s\S]+?)(?=\n##|$)/)
            variables.task_objective_excerpt = objectiveMatch
                ? objectiveMatch[1].trim().split('\n').slice(0, 3).join('\n')
                : 'N/A'

            // Checkboxes
            const checkboxes = taskContent.match(/- \[[ x]\]/g) || []
            const completed = taskContent.match(/- \[x\]/g) || []
            variables.total_checkboxes = String(checkboxes.length)
            variables.completed_checkboxes = String(completed.length)

            // Last completed
            const completedItems = taskContent.match(/- \[x\] (.*)/g)
            variables.last_completed_checkbox = completedItems
                ? completedItems[completedItems.length - 1].replace('- [x] ', '')
                : 'None'

            // Next uncompleted
            const uncompletedItems = taskContent.match(/- \[ \] (.*)/g)
            variables.next_uncompleted_checkbox = uncompletedItems ? uncompletedItems[0].replace('- [ ] ', '') : 'None'
        } catch {
            // Task parsing failed
        }
    }

    // 2. Session Context
    const contextPath = join(projectDir, 'context.md')
    if (existsSync(contextPath)) {
        try {
            const contextContent = readFileSync(contextPath, 'utf-8')
            const { frontmatter } = parseContext(contextContent)
            // Safely handle session number
            const session = frontmatter.session
            variables.session_number =
                typeof session === 'string' || typeof session === 'number' ? String(session) : 'N/A'
        } catch {
            variables.session_number = 'N/A'
        }
    }

    // 3. Git Context
    variables.current_branch = getCurrentBranch(cwd)
    variables.git_diff_stat = getGitDiffStat(cwd)
    variables.git_log_today = getGitLogToday(cwd)
    variables.last_commit = getLastCommit(cwd)

    // 4. Defaults for others
    variables.current_file = '{{current_file}}' // Expect user to fill
    variables.skill_level = 'intermediate' // Default

    // Convert all to strings and handle missing
    const result: Record<string, string> = {}
    const entries = Object.entries(variables)
    for (const [key, value] of entries) {
        if (value !== undefined) {
            result[key] = value
        }
    }

    return result
}

export function renderTemplate(content: string, variables: Record<string, string>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return variables[key] || match // Keep {{variable}} if not found
    })
}

function getGitDiffStat(cwd: string): string {
    try {
        return execSync('git diff --stat', { cwd, encoding: 'utf-8' }).trim() || 'No changes'
    } catch {
        return 'N/A'
    }
}

function getGitLogToday(cwd: string): string {
    try {
        return execSync('git log --since="midnight" --oneline', { cwd, encoding: 'utf-8' }).trim() || 'No commits today'
    } catch {
        return 'N/A'
    }
}

function getLastCommit(cwd: string): string {
    try {
        return execSync('git log -1 --oneline', { cwd, encoding: 'utf-8' }).trim()
    } catch {
        return 'N/A'
    }
}
