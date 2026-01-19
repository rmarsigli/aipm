import { logger } from '@/utils/logger.js'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import { execSync } from 'child_process'

export interface StartOptions {
    print?: boolean
    file?: string
    full?: boolean
    verbose?: boolean
}

export async function start(options: StartOptions = {}): Promise<void> {
    const cwd = process.cwd()
    const projectDir = join(cwd, '.project')

    // Check if .project exists
    if (!existsSync(projectDir)) {
        logger.error('No .project directory found. Run `aipim install` first.')
        process.exit(1)
    }

    logger.info('Generating session prompt...')

    const prompt = await generateSessionPrompt(projectDir, cwd, options)

    if (options.print) {
        // Print mode
        /* eslint-disable no-console */
        console.log('\n' + chalk.blue('═'.repeat(60)))
        console.log(chalk.blue.bold('  AIPIM SESSION PROMPT'))
        console.log(chalk.blue('═'.repeat(60)) + '\n')
        console.log(prompt)
        console.log('\n' + chalk.blue('═'.repeat(60)))
        console.log(chalk.gray('Copy the prompt above and paste into your AI chat.'))
        console.log(chalk.blue('═'.repeat(60)) + '\n')
        /* eslint-enable no-console */
    } else if (options.file) {
        // File mode
        const fs = await import('fs-extra')
        await fs.writeFile(options.file, prompt)
        logger.success(`Session prompt saved to: ${options.file}`)
    } else {
        // Clipboard mode (try to copy, fallback to print)
        const copied = await copyToClipboard(prompt)
        if (copied) {
            /* eslint-disable no-console */
            console.log('')
            console.log(chalk.green('✔') + ' Session prompt copied to clipboard!')
            console.log('')
            console.log(chalk.gray('Next steps:'))
            console.log(chalk.gray('  1. Open your AI chat (Claude.ai, Gemini, ChatGPT)'))
            console.log(chalk.gray('  2. Paste with Ctrl+V (or Cmd+V on Mac)'))
            console.log(chalk.gray('  3. Start developing!'))
            console.log('')
            /* eslint-enable no-console */
        } else {
            logger.warn('Could not copy to clipboard. Printing instead...')
            // Fallback to print mode
            await start({ ...options, print: true })
        }
    }
}

async function generateSessionPrompt(projectDir: string, cwd: string, options: StartOptions): Promise<string> {
    const parts: string[] = []

    // Header
    const projectName = getProjectName(cwd)
    const timestamp = new Date().toISOString().split('T')[0]
    parts.push(`# AIPIM Development Session - ${timestamp}`)
    parts.push('')
    parts.push(`## Project: ${projectName}`)
    parts.push('')

    // Context.md
    const contextPath = join(projectDir, 'context.md')
    if (existsSync(contextPath)) {
        const context = readFileSync(contextPath, 'utf-8')
        const { frontmatter, currentState, nextAction } = parseContext(context)

        parts.push(`**Session:** ${String(frontmatter.session) || 'N/A'}`)
        parts.push(`**Branch:** ${frontmatter.active_branches?.[0] || getCurrentBranch(cwd)}`)
        parts.push(`**Next Action:** ${nextAction || 'Not specified'}`)
        parts.push('')

        parts.push('## Current State')
        parts.push('')
        parts.push(currentState || 'No context available.')
        parts.push('')
    } else {
        logger.warn('No context.md found')
        parts.push('**Status:** No context.md found (run after first session)')
        parts.push('')
    }

    // Current task
    const taskPath = join(projectDir, 'current-task.md')
    if (existsSync(taskPath)) {
        const task = readFileSync(taskPath, 'utf-8')
        const taskInfo = parseTask(task)

        parts.push('## Active Task')
        parts.push('')
        parts.push(`**${taskInfo.title}** (${taskInfo.estimated_hours}h estimated)`)
        parts.push('')
        if (taskInfo.status === 'in-progress') {
            parts.push(`Status: In Progress (${taskInfo.actual_hours}h actual)`)
            if (taskInfo.currentPhase) {
                parts.push(`Current Phase: ${taskInfo.currentPhase}`)
            }
        }
        parts.push('')
    } else {
        parts.push('## Active Task')
        parts.push('')
        parts.push('**None** - No current task')
        parts.push('')
        parts.push('Available tasks in backlog/')
        parts.push('')
    }

    // Recent commits
    const commits = getRecentCommits(cwd, options.full ? 10 : 3)
    if (commits.length > 0) {
        parts.push('## Recent Commits')
        parts.push('')
        commits.forEach((commit, i) => {
            parts.push(`${i + 1}. \`${commit.hash}\` ${commit.message}`)
        })
        parts.push('')
    }

    // Recent decisions
    const decisionsDir = join(projectDir, 'decisions')
    if (existsSync(decisionsDir)) {
        const { readdirSync } = await import('fs')
        const adrs = readdirSync(decisionsDir)
            .filter((f: string) => f.endsWith('.md'))
            .sort()
            .reverse()
            .slice(0, options.full ? 5 : 1)

        if (adrs.length > 0) {
            parts.push('## Recent Decisions')
            parts.push('')
            adrs.forEach((adr: string) => {
                const adrPath = join(decisionsDir, adr)
                const content = readFileSync(adrPath, 'utf-8')
                const title = extractADRTitle(content)
                parts.push(`**${adr}:** ${title}`)
            })
            parts.push('')
        }
    }

    // Footer
    parts.push('---')
    parts.push('')
    parts.push("**I'm ready to continue development. Please:**")
    parts.push('1. Confirm you understand the project state')
    parts.push('2. Suggest the next immediate step')
    parts.push('')

    return parts.join('\n')
}

function parseContext(content: string): {
    frontmatter: Record<string, unknown>
    currentState: string
    nextAction: string
} {
    const lines = content.split('\n')
    const frontmatter: Record<string, unknown> = {}
    let currentState = ''
    let nextAction = ''

    // Parse frontmatter
    let inFrontmatter = false
    let inCurrentState = false

    for (const line of lines) {
        if (line.trim() === '---') {
            if (!inFrontmatter) {
                inFrontmatter = true
            } else {
                inFrontmatter = false
            }
            continue
        }

        if (inFrontmatter) {
            const match = line.match(/^(\w+):\s*(.+)$/)
            if (match) {
                const [, key, value] = match
                // Handle arrays
                if (value.startsWith('[') && value.endsWith(']')) {
                    frontmatter[key] = value
                        .slice(1, -1)
                        .split(',')
                        .map((s) => s.trim())
                } else {
                    frontmatter[key] = value
                }
            }
        }

        if (line.startsWith('# Current State')) {
            inCurrentState = true
            continue
        }

        if (inCurrentState) {
            if (line.startsWith('#')) {
                break
            }
            currentState += line + '\n'
        }
    }

    nextAction = (frontmatter.next_action as string) || ''
    currentState = currentState.trim()

    return { frontmatter, currentState, nextAction }
}

function parseTask(content: string): {
    title: string
    estimated_hours: string
    actual_hours: string
    status: string
    currentPhase: string | null
} {
    const lines = content.split('\n')
    let title = ''
    let estimated_hours = ''
    let actual_hours = ''
    let status = ''
    let currentPhase: string | null = null

    for (const line of lines) {
        if (line.startsWith('title:')) {
            title = line.replace('title:', '').trim().replace(/"/g, '')
        } else if (line.startsWith('estimated_hours:')) {
            estimated_hours = line.replace('estimated_hours:', '').trim()
        } else if (line.startsWith('actual_hours:')) {
            actual_hours = line.replace('actual_hours:', '').trim()
        } else if (line.startsWith('status:')) {
            status = line.replace('status:', '').trim()
        } else if (line.match(/^### Phase \d+:/)) {
            // Check if this phase has uncompleted items
            const phaseMatch = line.match(/^### (Phase \d+:.+)/)
            if (phaseMatch && !currentPhase) {
                currentPhase = phaseMatch[1]
            }
        }
    }

    return { title, estimated_hours, actual_hours, status, currentPhase }
}

function getProjectName(cwd: string): string {
    const packageJsonPath = join(cwd, 'package.json')
    if (existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { name?: string }
            return pkg.name || cwd.split('/').pop() || 'Unknown'
        } catch {
            // Fall through
        }
    }
    return cwd.split('/').pop() || 'Unknown'
}

function getCurrentBranch(cwd: string): string {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
            cwd,
            encoding: 'utf-8'
        }).trim()
        return branch
    } catch {
        return 'N/A'
    }
}

function getRecentCommits(cwd: string, count: number): Array<{ hash: string; message: string }> {
    try {
        const output = execSync(`git log -${count} --pretty=format:"%h||%s"`, {
            cwd,
            encoding: 'utf-8'
        })
        return output
            .trim()
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => {
                const [hash, ...rest] = line.split('||')
                return { hash, message: rest.join('||') }
            })
    } catch {
        return []
    }
}

function extractADRTitle(content: string): string {
    const match = content.match(/^# (.+)$/m)
    return match ? match[1] : 'No title'
}

async function copyToClipboard(text: string): Promise<boolean> {
    try {
        // Try clipboardy (cross-platform clipboard library)
        const { default: clipboardy } = await import('clipboardy')
        await clipboardy.write(text)
        return true
    } catch {
        logger.debug('Clipboardy not available, trying native clipboard...')
        // Fallback to native OS clipboard
        try {
            const platform = process.platform
            if (platform === 'darwin') {
                // macOS
                execSync('pbcopy', { input: text })
                return true
            } else if (platform === 'linux') {
                // Try xclip first, then xsel
                try {
                    execSync('xclip -selection clipboard', { input: text })
                    return true
                } catch {
                    execSync('xsel --clipboard --input', { input: text })
                    return true
                }
            } else if (platform === 'win32') {
                // Windows
                execSync('clip', { input: text })
                return true
            }
        } catch (nativeError) {
            logger.debug('Native clipboard failed', nativeError)
        }
    }
    return false
}
