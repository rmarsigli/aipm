import fs from 'fs-extra'
import path from 'path'
import { logger } from '@/utils/logger.js'

/**
 * Merges the base prompt with framework-specific guidelines.
 *
 * @param basePrompt - The content of the base prompt template
 * @param guidelines - Array of guideline IDs (e.g., 'react', 'astro')
 * @param templatesDir - Path to the templates directory
 * @returns The merged prompt content
 */
export async function mergeGuidelines(basePrompt: string, guidelines: string[], templatesDir: string): Promise<string> {
    if (!guidelines || guidelines.length === 0) {
        return basePrompt
    }

    logger.debug(`Merging guidelines: ${guidelines.join(', ')}`)
    const guidelineContents: string[] = []

    for (const guideline of guidelines) {
        const guidelinePath = path.join(templatesDir, `guidelines/${guideline}.md`)

        if (await fs.pathExists(guidelinePath)) {
            const content = await fs.readFile(guidelinePath, 'utf-8')
            guidelineContents.push(content)
        }
    }

    if (guidelineContents.length === 0) {
        return basePrompt
    }

    const mergedGuidelines = guidelineContents.join('\n\n---\n\n')

    const merged = basePrompt.replace(
        /{{SLOT:guidelines}}[\s\S]*?{{\/SLOT:guidelines}}/,
        `{{SLOT:guidelines}}\n\n${mergedGuidelines}\n\n{{/SLOT:guidelines}}`
    )

    return merged
}
