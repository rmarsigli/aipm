import fs from 'fs-extra'
import path from 'path'
import { mergeGuidelines } from './merger.js'
import { InstallConfig, DetectedProject } from '@/types/index.js'
import { FILES, PROJECT_STRUCTURE } from '@/constants.js'
import { logger } from '@/utils/logger.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Installs the project configuration and generates prompt files.
 *
 * @param config - The installation configuration (AI tools, guidelines, etc.)
 * @param _detected - The detected project details (unused in current logic but kept for interface consistency)
 * @throws Error if templates directory is missing or file operations fail
 */
export async function installProject(config: InstallConfig, _detected: DetectedProject): Promise<void> {
    logger.debug('Starting installation process')

    // Try to find templates relative to the current script
    // In production (dist), it usually is a sibling 'templates'
    // In development (src/core), it is '../templates'
    let templatesDir = path.join(__dirname, 'templates')

    if (!fs.existsSync(templatesDir)) {
        templatesDir = path.join(__dirname, '../templates')
    }

    if (!fs.existsSync(templatesDir)) {
        // Fallback for when running from root or unexpected structure
        templatesDir = path.join(process.cwd(), 'src/templates')
    }

    if (!fs.existsSync(templatesDir)) {
        logger.error(`Templates directory not found in: ${templatesDir}`)
        throw new Error(
            `Templates directory not found. Searched in: ${path.join(__dirname, 'templates')} and ${path.join(__dirname, '../templates')}`
        )
    }

    logger.debug(`Using templates from: ${templatesDir}`)
    await createProjectStructure(templatesDir)

    logger.debug('Generating prompt files...')
    await Promise.all(config.ais.map((ai) => generatePrompt(ai, config, templatesDir)))

    logger.debug('Making scripts executable...')
    await makeScriptsExecutable()

    logger.success('Installation completed successfully')
}

async function createProjectStructure(templatesDir: string): Promise<void> {
    logger.debug('Creating project structure...')
    const baseDir = path.join(templatesDir, 'base/.project')
    const targetDir = '.project'

    try {
        await fs.copy(baseDir, targetDir, {
            overwrite: false,
            errorOnExist: false
        })
    } catch (error) {
        const err = error as { code?: string }

        if (err.code === 'EACCES') {
            throw new Error(`Permission denied: Cannot write to ${targetDir}`)
        }
        if (err.code === 'ENOSPC') {
            throw new Error('Disk full: Not enough space to install')
        }

        throw error
    }

    const projectDir = path.join(process.cwd(), FILES.PROJECT_DIR)

    // Create structure
    await fs.ensureDir(projectDir)

    // Create standard directories
    // Create standard directories
    await Promise.all(PROJECT_STRUCTURE.map((dir) => fs.ensureDir(path.join(projectDir, dir))))

    // Copy templates
    // ... (templates logic remains as it depends on template filenames which are dynamic based on config)

    // But we should use FILES for specific known files
    // The installer logic is complex regarding which files to copy...
    // Let's just fix the .project reference for now.
}

async function generatePrompt(ai: string, config: InstallConfig, templatesDir: string): Promise<void> {
    const basePath = path.join(templatesDir, 'base/project-manager.md')
    let basePrompt = await fs.readFile(basePath, 'utf-8')

    if (config.guidelines && config.guidelines.length > 0) {
        basePrompt = await mergeGuidelines(basePrompt, config.guidelines, templatesDir)
    }

    const filename = getPromptFilename(ai)

    await fs.writeFile(filename, basePrompt, 'utf-8')
}

function getPromptFilename(ai: string): string {
    const filenames: Record<string, string> = {
        'claude-code': 'CLAUDE.md',
        'claude-ai': 'CLAUDE.md',
        gemini: 'GEMINI.md',
        chatgpt: 'CHATGPT.md'
    }

    return filenames[ai] || `${ai.toUpperCase()}.md`
}

async function makeScriptsExecutable(): Promise<void> {
    const scripts = ['.project/scripts/pre-session.sh', '.project/scripts/validate-dod.sh']

    await Promise.all(
        scripts.map(async (script) => {
            if (await fs.pathExists(script)) {
                await fs.chmod(script, '755')
            }
        })
    )
}
