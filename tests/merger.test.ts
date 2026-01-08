import { mergeGuidelines } from '../src/core/merger.js'
import { createTempDir, cleanupTempDir } from './setup.js'
import fs from 'fs-extra'
import path from 'path'
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { guidelineRegistry } from '../src/core/guidelines.js'
import { logger } from '../src/utils/logger.js'

describe('mergeGuidelines', () => {
    let tempDir: string
    let resolveSpy: any

    beforeEach(async () => {
        tempDir = await createTempDir()
        await fs.ensureDir(path.join(tempDir, 'guidelines'))

        // Suppress warn logs
        jest.spyOn(logger, 'warn').mockImplementation(() => {})

        resolveSpy = jest.spyOn(guidelineRegistry, 'resolveTemplate').mockImplementation(async (id: string, dir: string) => {
            const p = path.join(dir, 'guidelines', `${id}.md`)
            if (await fs.pathExists(p)) {
                return await fs.readFile(p, 'utf-8')
            }
            throw new Error(`Guideline '${id}' not found.`)
        })
    })

    afterEach(async () => {
        resolveSpy.mockRestore()
        await cleanupTempDir(tempDir)
    })

    const basePrompt = `# Base Prompt

{{SLOT:guidelines}}
<!-- Default guidelines -->
{{/SLOT:guidelines}}

## Other content`

    test('merges single guideline', async () => {
        await fs.writeFile(
            path.join(tempDir, 'guidelines/react.md'),
            '## React Guidelines\n\nUse hooks.'
        )

        const result = await mergeGuidelines(basePrompt, ['react'], tempDir)

        expect(result).toContain('## React Guidelines')
        expect(result).toContain('Use hooks.')
        expect(result).toContain('## Other content')
    })

    test('merges multiple guidelines with separator', async () => {
        await fs.writeFile(
            path.join(tempDir, 'guidelines/react.md'),
            '## React Guidelines'
        )
        await fs.writeFile(
            path.join(tempDir, 'guidelines/typescript.md'),
            '## TypeScript Guidelines'
        )

        const result = await mergeGuidelines(basePrompt, ['react', 'typescript'], tempDir)

        expect(result).toContain('## React Guidelines')
        expect(result).toContain('---')
        expect(result).toContain('## TypeScript Guidelines')
    })

    test('returns base prompt when no guidelines found', async () => {
        const result = await mergeGuidelines(basePrompt, ['nonexistent'], tempDir)

        expect(result).toBe(basePrompt)
    })

    test('ignores missing guidelines and includes existing', async () => {
        await fs.writeFile(
            path.join(tempDir, 'guidelines/react.md'),
            '## React Guidelines'
        )

        const result = await mergeGuidelines(basePrompt, ['react', 'nonexistent'], tempDir)

        expect(result).toContain('## React Guidelines')
    })

    test('returns base prompt for empty guidelines array', async () => {
        const result = await mergeGuidelines(basePrompt, [], tempDir)
        expect(result).toBe(basePrompt)
    })

    test('returns base prompt when guidelines do not exist on disk', async () => {
        // Explicitly ensuring no files exist
        const result = await mergeGuidelines(basePrompt, ['non-existent-guideline'], tempDir)
        expect(result).toBe(basePrompt)
    })

    test('returns base prompt for undefined guidelines', async () => {
        const result = await mergeGuidelines(basePrompt, undefined as any, tempDir)
        expect(result).toBe(basePrompt)
    })
})
