import { Command } from 'commander'
import { taskManager } from '@/core/task-manager.js'
import { logger } from '@/utils/logger.js'
import { output } from '@/utils/output.js'
import chalk from 'chalk'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { copyToClipboard } from '@/utils/clipboard.js'
import { getCurrentBranch, parseContext } from '@/utils/context.js'
import { FILES } from '@/constants.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function registerTaskCommand(program: Command): void {
    const task = program.command('task').description('Manage project tasks')

    task.command('init')
        .argument('<type>', 'Task type (feat, fix, chore, etc.)')
        .argument('<name>', 'Task name')
        .description('Initialize a new task')
        .action(async (type: string, name: string) => {
            try {
                logger.info(`Creating new task: ${type}/${name}...`)
                const path = await taskManager.initTask(process.cwd(), { type, name })
                logger.success(`Task created: ${chalk.bold(path)}`)
                logger.info('Backlog updated successfully.')
            } catch (error) {
                logger.error('Failed to create task')
                if (error instanceof Error) {
                    logger.debug(error.message)
                }
                process.exit(1)
            }
        })

    task.command('next')
        .description('Generate prompt for next task in backlog')
        .option('--print', 'Print to console instead of clipboard')
        .action(async (options: { print?: boolean }) => {
            await nextTask(options)
        })
}

async function nextTask(options: { print?: boolean }): Promise<void> {
    const log = output.print.bind(output)
    const cwd = process.cwd()
    const projectDir = join(cwd, '.project')

    // Check .project exists
    if (!existsSync(projectDir)) {
        logger.error('No .project directory found. Run `aipim install` first.')
        process.exit(1)
    }

    // Find next task in backlog
    const backlogDir = join(projectDir, 'backlog')
    if (!existsSync(backlogDir)) {
        logger.error('No backlog directory found.')
        process.exit(1)
    }

    const backlogFiles = readdirSync(backlogDir)
        .filter((f) => f.endsWith('.md'))
        .sort() // Alphabetical order

    if (backlogFiles.length === 0) {
        logger.warn('No tasks in backlog. All done!')
        process.exit(0)
    }

    const nextTaskFile = backlogFiles[0]
    logger.info(`Next task: ${chalk.cyan(nextTaskFile)}`)

    // Count completed tasks
    const completedDir = join(projectDir, 'completed')
    const completedCount = existsSync(completedDir)
        ? readdirSync(completedDir).filter((f) => f.endsWith('.md')).length
        : 0

    // Get session number
    const contextPath = join(projectDir, FILES.CONTEXT_FILE)
    let sessionNumber = 'N/A'
    if (existsSync(contextPath)) {
        const contextContent = readFileSync(contextPath, 'utf-8')
        const { frontmatter } = parseContext(contextContent)
        const session = frontmatter.session
        sessionNumber = typeof session === 'number' || typeof session === 'string' ? String(session) : 'N/A'
    }

    // Get current branch
    const branch = await getCurrentBranch(cwd)

    // Load template
    // tsup bundles everything into dist/cli.js, so __dirname is dist/
    // We need to find the template relative to the cli.js location
    const possiblePaths = [
        join(__dirname, 'prompts/templates/next-task.md'), // dist/prompts/templates/next-task.md
        join(__dirname, '../prompts/templates/next-task.md'), // src/prompts/templates/next-task.md (dev)
        join(__dirname, '../../prompts/templates/next-task.md') // Fallback
    ]

    let templatePath = ''
    for (const path of possiblePaths) {
        if (existsSync(path)) {
            templatePath = path
            break
        }
    }

    if (!templatePath) {
        logger.error('Template next-task.md not found')
        logger.debug(`Tried paths: ${possiblePaths.join(', ')}`)
        process.exit(1)
    }

    let template = readFileSync(templatePath, 'utf-8')

    // Replace variables
    template = template.replace(/\{\{completed_tasks_count\}\}/g, String(completedCount))
    template = template.replace(/\{\{session_number\}\}/g, sessionNumber)
    template = template.replace(/\{\{current_branch\}\}/g, branch)
    template = template.replace(/\{\{task_file_name\}\}/g, nextTaskFile)

    // Output
    if (options.print) {
        log('\n' + chalk.blue('═'.repeat(60)))
        log(chalk.blue.bold('  NEXT TASK PROMPT'))
        log(chalk.blue('═'.repeat(60)) + '\n')
        log(template)
        log('\n' + chalk.blue('═'.repeat(60)))
        log(chalk.gray('Copy the prompt above and paste into your AI chat.'))
        log(chalk.blue('═'.repeat(60)) + '\n')
    } else {
        const copied = await copyToClipboard(template)
        if (copied) {
            log('')
            log(chalk.green('[OK]') + ' Next task prompt copied to clipboard!')
            log('')
            log(chalk.cyan('Task: ') + nextTaskFile)
            log(chalk.gray('Progress: ') + `${completedCount} tasks completed`)
            log(chalk.gray('Session: ') + sessionNumber)
            log('')
            log(chalk.gray('Paste into Gemini/Claude and start working!'))
            log('')
        } else {
            logger.warn('Could not copy to clipboard. Printing instead...')
            await nextTask({ print: true })
        }
    }
}
