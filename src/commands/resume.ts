import { logger } from '@/utils/logger.js'
import { existsSync, readFileSync } from 'fs'
import { unlink } from 'fs/promises'
import { join } from 'path'
import chalk from 'chalk'
import { FILES } from '@/constants.js'
import { git, gitLog } from '@/utils/git.js'
import { confirm } from '@inquirer/prompts'
import { start } from './start.js'
import { parseContext, parseTask, calculateProgress, extractCheckpoints, extractObjective } from '@/utils/context.js'

export interface ResumeOptions {
    auto?: boolean
    verbose?: boolean
    logger?: { log: (msg: string) => void }
}

export async function resume(options: ResumeOptions = {}): Promise<void> {
    const log = options.logger?.log || console.log
    const cwd = process.cwd()
    const projectDir = join(cwd, '.project')

    // Check if .project exists
    if (!existsSync(projectDir)) {
        logger.error('No .project directory found. Run `aipim install` first.')
        process.exit(1)
    }

    const snapshotPath = join(projectDir, '.interruption-snapshot.json')

    // Check for interruption snapshot first
    if (existsSync(snapshotPath)) {
        try {
            const snapshotContent = readFileSync(snapshotPath, 'utf-8')
            interface Snapshot {
                timestamp: string | number | Date
                reason: string
                task?: {
                    title: string
                }
                git?: {
                    is_dirty: boolean
                    stash_hash?: string
                }
            }

            const snapshot = JSON.parse(snapshotContent) as Snapshot

            // Show interruption banner

            log('')
            log(chalk.red('📎 Interruption Detected'))
            log(chalk.gray(`   Paused: ${new Date(snapshot.timestamp).toLocaleString()}`))
            log(chalk.gray(`   Reason: ${snapshot.reason}`))
            log('')

            log(chalk.bold('🎯 Context at pause:'))
            log(`   Task: ${snapshot.task?.title || 'Unknown'}`)

            if (snapshot.git?.is_dirty) {
                log(chalk.yellow('   ⚠️  Uncommitted changes were detected.'))
                if (snapshot.git.stash_hash) {
                    log(chalk.green('      (Stashed automatically)'))
                }
            }
            log('')

            const action = await confirm({
                message: 'Restore interrupted session?',
                default: true
            })

            if (action) {
                // Restore logic
                if (snapshot.git?.stash_hash) {
                    log('🔄 Restoring stashed changes...')
                    try {
                        await git(['stash', 'pop'])
                        log('✅ Changes restored.')
                    } catch (e) {
                        console.error(
                            chalk.red(
                                `❌ Failed to pop stash. You may need to resolve conflicts manually. (${String(e)})`
                            )
                        )
                    }
                }

                // Remove snapshot
                await unlink(snapshotPath)

                log(chalk.green('\n✅ Context restored. Resuming work...'))
                await start({ print: false, logger: options.logger })
                return
            } else {
                log(chalk.gray('Discarding snapshot...'))
                await unlink(snapshotPath)
            }
        } catch (e) {
            console.error('Error reading snapshot:', e)
        }
    }

    const resumeData = await generateResumeSummary(projectDir, cwd)

    // Display summary
    displayResumeSummary(resumeData, log)

    // Interactive continuation
    if (!options.auto) {
        const answer = await confirm({
            message: 'Ready to continue?',
            default: true
        })

        if (answer) {
            log('')

            await start({ print: false, logger: options.logger })
        } else {
            log('')
            log(chalk.gray('Run `aipim start` when ready to continue.'))
            log('')
        }
    } else {
        // Auto mode: go straight to start
        await start({ print: false, logger: options.logger })
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

async function generateResumeSummary(projectDir: string, cwd: string): Promise<ResumeSummary> {
    // Parse context.md
    const contextPath = join(projectDir, FILES.CONTEXT_FILE)
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
    const taskPath = join(projectDir, FILES.CURRENT_TASK_FILE)
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
    const output = await gitLog(1, '%h||%s', cwd)
    if (output.trim()) {
        const [hash, ...rest] = output.split('||')
        lastCommit = { hash, message: rest.join('||') }
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

function displayResumeSummary(data: ResumeSummary, log: (msg: string) => void): void {
    displayHeader(data, log)

    // Handle different statuses
    if (data.status === 'fresh') {
        log(chalk.green('[FRESH] Fresh! You just stopped working.'))
        log('')
    }

    if (data.status === 'no-task') {
        log(chalk.yellow('[WARN] No active task'))
        log(chalk.gray('  Run `aipim task list` to see available tasks'))
        log('')
        displayFooter(data, log)
        return
    }

    if (data.status === 'completed') {
        log(chalk.green('[DONE] Task completed!'))
        log(chalk.gray('  Choose your next task from the backlog'))
        log('')
        displayFooter(data, log)
        return
    }

    // Active task
    if (data.task) {
        displayTaskDetails(data.task, log)
        displayCheckpoints(data.task, log)
        displayContext(data.task, data.nextAction, log)
    }

    displayFooter(data, log)
}

/**
 * Displays the session header and age information.
 */
function displayHeader(data: ResumeSummary, log: (msg: string) => void): void {
    log('')
    log(chalk.blue('═'.repeat(60)))
    log(chalk.blue.bold('  AIPIM SESSION RESUME'))
    log(chalk.blue('═'.repeat(60)))
    log('')

    log(`${data.sessionAge.indicator} Last Session: ${chalk.bold(data.sessionAge.text)}`)
    log('')
}

/**
 * Displays the details of the active task, including title, phase, and progress.
 */
function displayTaskDetails(task: NonNullable<ResumeSummary['task']>, log: (msg: string) => void): void {
    log(`${chalk.bold('You were working on:')} ${chalk.cyan(task.title)}`)
    if (task.phase) {
        log(chalk.gray(`   ${task.phase} (${task.estimatedHours}h estimated)`))
    }
    log(
        chalk.gray(
            `   Progress: ${task.progress.completed}/${task.progress.total} checkboxes (${task.progress.percentage}%)`
        )
    )
    log('')
}

/**
 * Displays the checkpoints (last completed, current, next) for the task.
 */
function displayCheckpoints(task: NonNullable<ResumeSummary['task']>, log: (msg: string) => void): void {
    log(chalk.bold('You stopped at:'))
    if (task.lastCompleted.length > 0) {
        task.lastCompleted.forEach((item) => {
            log(chalk.green(`   [x] ${item}`))
        })
    }
    if (task.currentItem) {
        log(chalk.yellow(`   >> Working on: ${task.currentItem}`))
    }
    if (task.nextItem) {
        log(chalk.gray(`   -- Next: ${task.nextItem}`))
    }
    log('')
}

/**
 * Displays context information and the suggested next action.
 */
function displayContext(
    task: NonNullable<ResumeSummary['task']>,
    nextAction: string,
    log: (msg: string) => void
): void {
    if (task.objective) {
        log(chalk.bold('Quick context:'))
        log(chalk.gray(`   ${task.objective}`))
        log('')
    }

    log(chalk.bold('Suggested next action:'))
    log(chalk.gray(`   ${nextAction}`))
    log('')
}

/**
 * Displays the footer and last commit information.
 */
function displayFooter(data: ResumeSummary, log: (msg: string) => void): void {
    if (data.lastCommit) {
        log(`Last commit: ${chalk.cyan(data.lastCommit.hash)} "${data.lastCommit.message}"`)
        log('')
    }

    log(chalk.blue('═'.repeat(60)))
    log('')
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
        indicator = chalk.green('●')
    } else if (diffHours < 2) {
        text = `${diffHours} hour ago`
        indicator = chalk.green('●')
    } else if (diffHours < 24) {
        text = `${diffHours} hours ago`
        indicator = chalk.yellow('●')
    } else if (diffDays === 1) {
        text = '1 day ago'
        indicator = chalk.yellow('●')
    } else if (diffDays < 7) {
        text = `${diffDays} days ago`
        indicator = chalk.yellow('●')
    } else {
        text = `${diffDays} days ago [!] It's been a while!`
        indicator = chalk.red('●')
    }

    return { text, indicator, hours: diffHours }
}
