import fs from 'fs-extra'
import path from 'path'
import { FRAMEWORKS, LOCK_FILES, PROMPT_FILES } from '@/config/frameworks.js'
import { DetectedProject, FrameworkConfig, PackageJson } from '@/types/index.js'
import { FILES } from '@/constants.js'
import { logger } from '@/utils/logger.js'

/**
 * Detects the project configuration in the specified directory.
 * Identifies the framework, package manager, and existing AI configuration files.
 *
 * @param cwd - The current working directory to scan (default: process.cwd())
 * @returns A promise resolving to the detected project details
 */
export async function detectProject(cwd: string = process.cwd()): Promise<DetectedProject> {
    logger.debug(`Detecting project in: ${cwd}`)
    const pkgPath = path.join(cwd, FILES.PACKAGE_JSON)
    const pkg = (await fs.pathExists(pkgPath)) ? ((await fs.readJson(pkgPath)) as PackageJson) : null

    const [hasGit, hasNodeModules, hasProject, promptFiles] = await Promise.all([
        fs.pathExists(path.join(cwd, FILES.GIT_DIR)),
        fs.pathExists(path.join(cwd, FILES.NODE_MODULES)),
        fs.pathExists(path.join(cwd, FILES.PROJECT_DIR)),
        filterExistingFiles(cwd, PROMPT_FILES)
    ])

    const { framework, frameworkVersion } = detectFramework(pkg, cwd)

    return {
        framework,
        frameworkVersion,
        packageManager: await detectPackageManager(cwd),
        hasGit,
        hasNodeModules,
        existingSetup: {
            hasProject,
            hasPrompts: promptFiles
        }
    }
}

function detectFramework(
    pkg: PackageJson | null,
    cwd: string
): { framework: string | null; frameworkVersion: string | null } {
    // Try to match framework (works for both package.json-based and file-based detection)
    const match = FRAMEWORKS.find((sig: FrameworkConfig) => {
        // Change working directory temporarily for hasFile checks
        const originalCwd = process.cwd()
        try {
            process.chdir(cwd)
            return sig.check(pkg || ({} as PackageJson))
        } finally {
            process.chdir(originalCwd)
        }
    })

    if (!match) return { framework: null, frameworkVersion: null }

    // For package.json-based frameworks, try to get version
    const version = pkg ? getDepVersion(pkg, match.id) || getDepVersion(pkg, match.id.split('-')[0]) : null

    return {
        framework: match.id,
        frameworkVersion: version
    }
}

async function detectPackageManager(cwd: string): Promise<string | null> {
    for (const [file, manager] of Object.entries(LOCK_FILES)) {
        if (await fs.pathExists(path.join(cwd, file))) return manager
    }
    return null
}

const getDepVersion = (pkg: PackageJson, name: string): string =>
    pkg?.dependencies?.[name] || pkg?.devDependencies?.[name] || ''

async function filterExistingFiles(cwd: string, files: string[]): Promise<string[]> {
    const existing: string[] = []
    for (const file of files) {
        if (await fs.pathExists(path.join(cwd, file))) existing.push(file)
    }
    return existing
}

/**
 * Returns the human-readable display name for a framework ID.
 *
 * @param frameworkId - The framework identifier (e.g., 'next-js')
 * @returns The display name (e.g., 'Next.js') or the ID if not found
 */
export function getFrameworkDisplayName(frameworkId: string | null): string {
    if (!frameworkId) return ''
    return FRAMEWORKS.find((f) => f.id === frameworkId)?.name || frameworkId
}
