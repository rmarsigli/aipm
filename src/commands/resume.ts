import { logger } from '@/utils/logger.js'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import { execSync } from 'child_process'
import { confirm } from '@inquirer/prompts'
import { start } from './start.js'

export interface ResumeOptions {
    auto?: boolean
    verbose?: boolean
}

export async function resume(options: ResumeOptions = {}): Promise<void> {
    const cwd = process.cwd()
    const projectDir = join(cwd, '.project')

    // Check if .project exists
    if (!existsSync(projectDir)) {
        logger.error('No .project directory found. Run `aipim install` first.')
        process.exit(1)
    }

    const resumeData = generateResumeSummary(projectDir, cwd)

    // Display summary
    displayResumeSummary(resumeData)

    // Interactive continuation
    if (!options.auto) {
        const answer = await confirm({
            message: 'Ready to continue?',
            default: true
        })

        if (answer) {
            /* eslint-disable no-console */
            console.log('')
            /* eslint-enable no-console */
            await start({ print: false })
        } else {
            /* eslint-disable no-console */
            console.log('')
            console.log(chalk.gray('Run `aipim start` when ready to continue.'))
            console.log('')
            /* eslint-enable no-console */
        }
    } else {
        // Auto mode: go straight to start
        await start({ print: false })
    }
}

interface ResumeSummary {
    sessionAge: {
        text: string
        indicator: string
        hours: number
    }
    task: {
        title: string
        phase: string | null
        estimatedHours: string
        progress: {
            completed: number
            total: number
            percentage: number
        }
        lastCompleted: string[]
        currentItem: string | null
        nextItem: string | null
        objective: string
    } | null
    nextAction: string
    lastCommit: {
        hash: string
        message: string
    } | null
    status: 'active' | 'no-task' | 'completed' | 'fresh'
}

function generateResumeSummary(projectDir: string, cwd: string): ResumeSummary {
    // Parse context.md
    const contextPath = join(projectDir, 'context.md')
    let lastUpdated = new Date()
    let nextAction = 'Not specified'

    if (existsSync(contextPath)) {
        const context = readFileSync(contextPath, 'utf-8')
        const { frontmatter } = parseContext(context)
        if (frontmatter.last_updated) {
            lastUpdated = new Date(frontmatter.last_updated as string)
        }
        nextAction = (frontmatter.next_action as string) || 'Not specified'
    }

    const sessionAge = formatSessionAge(lastUpdated)

    // Parse current task
    const taskPath = join(projectDir, 'current-task.md')
    let taskData: ResumeSummary['task'] = null
    let status: ResumeSummary['status'] = 'no-task'

    if (existsSync(taskPath)) {
        const taskContent = readFileSync(taskPath, 'utf-8')
        const task = parseTask(taskContent)

        if (task.status === 'completed') {
            status = 'completed'
        } else if (task.status === 'in-progress') {
            status = 'active'
        }

        const progress = calculateProgress(taskContent)
        const checkpoints = extractCheckpoints(taskContent)

        taskData = {
            title: task.title,
            phase: task.currentPhase,
            estimatedHours: task.estimated_hours,
            progress,
            lastCompleted: checkpoints.lastCompleted,
            currentItem: checkpoints.current,
            nextItem: checkpoints.next,
            objective: extractObjective(taskContent)
        }
    } else {
        status = 'no-task'
    }

    // Get last commit
    let lastCommit: ResumeSummary['lastCommit'] = null
    try {
        const output = execSync('git log -1 --pretty=format:"%h||%s"', {
            cwd,
            encoding: 'utf-8'
        })
        if (output.trim()) {
            const [hash, ...rest] = output.split('||')
            lastCommit = { hash, message: rest.join('||') }
        }
    } catch {
        // No git or no commits
    }

    // Determine status
    if (sessionAge.hours < 1) {
        status = 'fresh'
    }

    return {
        sessionAge,
        task: taskData,
        nextAction,
        lastCommit,
        status
    }
}

function displayResumeSummary(data: ResumeSummary): void {
    /* eslint-disable no-console */
    console.log('')
    console.log(chalk.blue('═'.repeat(60)))
    console.log(chalk.blue.bold('  📋 AIPIM SESSION RESUME'))
    console.log(chalk.blue('═'.repeat(60)))
    console.log('')

    // Session age
    console.log(`${data.sessionAge.indicator} Last Session: ${chalk.bold(data.sessionAge.text)}`)
    console.log('')

    // Handle different statuses
    if (data.status === 'fresh') {
        console.log(chalk.green('✨ Fresh! You just stopped working.'))
        console.log('')
    }

    if (data.status === 'no-task') {
        console.log(chalk.yellow('⚠️  No active task'))
        console.log(chalk.gray('  Run `aipim task list` to see available tasks'))
        console.log('')
        if (data.lastCommit) {
            console.log(`📎 Last commit: ${chalk.cyan(data.lastCommit.hash)} "${data.lastCommit.message}"`)
        }
        console.log(chalk.blue('═'.repeat(60)))
        /* eslint-enable no-console */
        return
    }

    if (data.status === 'completed') {
        console.log(chalk.green('✅ Task completed!'))
        console.log(chalk.gray('  Choose your next task from the backlog'))
        console.log('')
        if (data.lastCommit) {
            console.log(`📎 Last commit: ${chalk.cyan(data.lastCommit.hash)} "${data.lastCommit.message}"`)
        }
        console.log(chalk.blue('═'.repeat(60)))

        return
    }

    // Active task
    if (data.task) {
        console.log(chalk.bold('🎯 You were working on:'), chalk.cyan(data.task.title))
        if (data.task.phase) {
            console.log(chalk.gray(`   ${data.task.phase} (${data.task.estimatedHours}h estimated)`))
        }
        console.log(
            chalk.gray(
                `   Progress: ${data.task.progress.completed}/${data.task.progress.total} checkboxes (${data.task.progress.percentage}%)`
            )
        )
        console.log('')

        // Checkpoints
        console.log(chalk.bold('⏸️  You stopped at:'))
        if (data.task.lastCompleted.length > 0) {
            data.task.lastCompleted.forEach((item) => {
                console.log(chalk.green(`   ✅ ${item}`))
            })
        }
        if (data.task.currentItem) {
            console.log(chalk.yellow(`   🔄 Working on: ${data.task.currentItem}`))
        }
        if (data.task.nextItem) {
            console.log(chalk.gray(`   ⏳ Next: ${data.task.nextItem}`))
        }
        console.log('')

        // Context
        if (data.task.objective) {
            console.log(chalk.bold('🧠 Quick context:'))
            console.log(chalk.gray(`   ${data.task.objective}`))
            console.log('')
        }

        // Suggestion
        console.log(chalk.bold('💡 Suggested next action:'))
        console.log(chalk.gray(`   ${data.nextAction}`))
        console.log('')
    }

    // Last commit
    if (data.lastCommit) {
        console.log(`📎 Last commit: ${chalk.cyan(data.lastCommit.hash)} "${data.lastCommit.message}"`)
        console.log('')
    }

    console.log(chalk.blue('═'.repeat(60)))
    console.log('')
}

function formatSessionAge(lastUpdated: Date): { text: string; indicator: string; hours: number } {
    const now = new Date()
    const diffMs = now.getTime() - lastUpdated.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    let text = ''
    let indicator = ''

    if (diffHours < 1) {
        text = 'less than an hour ago'
        indicator = '🟢'
    } else if (diffHours < 2) {
        text = `${diffHours} hour ago`
        indicator = '🟢'
    } else if (diffHours < 24) {
        text = `${diffHours} hours ago`
        indicator = '🟡'
    } else if (diffDays === 1) {
        text = '1 day ago'
        indicator = '🟡'
    } else if (diffDays < 7) {
        text = `${diffDays} days ago`
        indicator = '🟡'
    } else {
        text = `${diffDays} days ago ⚠️  It's been a while!`
        indicator = '🔴'
    }

    return { text, indicator, hours: diffHours }
}

function parseContext(content: string): {
    frontmatter: Record<string, unknown>
} {
    const lines = content.split('\n')
    const frontmatter: Record<string, unknown> = {}

    let inFrontmatter = false

    for (const line of lines) {
        if (line.trim() === '---') {
            if (!inFrontmatter) {
                inFrontmatter = true
            } else {
                break
            }
            continue
        }

        if (inFrontmatter) {
            const match = line.match(/^(\w+):\s*(.+)$/)
            if (match) {
                const [, key, value] = match
                if (value.startsWith('[') && value.endsWith(']')) {
                    frontmatter[key] = value
                        .slice(1, -1)
                        .split(',')
                        .map((s) => s.trim())
                } else if (value.startsWith('"') && value.endsWith('"')) {
                    frontmatter[key] = value.slice(1, -1)
                } else {
                    frontmatter[key] = value
                }
            }
        }
    }

    return { frontmatter }
}

function parseTask(content: string): {
    title: string
    estimated_hours: string
    status: string
    currentPhase: string | null
} {
    const lines = content.split('\n')
    let title = ''
    let estimated_hours = ''
    let status = ''
    let currentPhase: string | null = null

    for (const line of lines) {
        if (line.startsWith('title:')) {
            title = line.replace('title:', '').trim().replace(/"/g, '')
        } else if (line.startsWith('estimated_hours:')) {
            estimated_hours = line.replace('estimated_hours:', '').trim()
        } else if (line.startsWith('status:')) {
            status = line.replace('status:', '').trim()
        } else if (line.match(/^### Phase \d+:/)) {
            if (!currentPhase) {
                const phaseMatch = line.match(/^### (Phase \d+:.+)/)
                if (phaseMatch) {
                    currentPhase = phaseMatch[1]
                }
            }
        }
    }

    return { title, estimated_hours, status, currentPhase }
}

function calculateProgress(content: string): {
    completed: number
    total: number
    percentage: number
} {
    const checkboxes = content.match(/- \[[ x]\]/g) || []
    const completed = content.match(/- \[x\]/gi)?.length || 0
    const total = checkboxes.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, percentage }
}

function extractCheckpoints(content: string): {
    lastCompleted: string[]
    current: string | null
    next: string | null
} {
    const lines = content.split('\n')
    const completed: string[] = []
    let current: string | null = null
    let next: string | null = null

    let foundCurrent = false

    for (const line of lines) {
        const checkedMatch = line.match(/^- \[x\]\s*(.+)$/i)
        if (checkedMatch && !foundCurrent) {
            completed.push(checkedMatch[1].trim())
        }

        const uncheckedMatch = line.match(/^- \[ \]\s*(.+)$/)
        if (uncheckedMatch && !foundCurrent) {
            current = uncheckedMatch[1].trim()
            foundCurrent = true
        } else if (uncheckedMatch && foundCurrent && !next) {
            next = uncheckedMatch[1].trim()
            break
        }
    }

    // Return last 3 completed items
    const lastCompleted = completed.slice(-3)

    return { lastCompleted, current, next }
}

function extractObjective(content: string): string {
    const lines = content.split('\n')
    let inObjective = false
    let objective = ''

    for (const line of lines) {
        if (line.startsWith('## Objective')) {
            inObjective = true
            continue
        }

        if (inObjective) {
            if (line.startsWith('##')) {
                break
            }
            if (line.trim() && !line.startsWith('**')) {
                objective += line.trim() + ' '
                if (objective.length > 150) {
                    break
                }
            }
        }
    }

    return objective.trim().substring(0, 200)
}
