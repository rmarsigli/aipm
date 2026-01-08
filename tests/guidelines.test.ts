import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { guidelineRegistry } from '../src/core/guidelines'
import path from 'path'
import fs from 'fs-extra'

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('GuidelineRegistry', () => {
    const mockTemplatesDir = path.join(__dirname, 'temp_templates')

    beforeEach(async () => {
        await fs.ensureDir(mockTemplatesDir)
        await fs.ensureDir(path.join(mockTemplatesDir, 'guidelines'))
    })

    afterEach(async () => {
        // Retry logic for potential file locks on Windows/cleanup race conditions
        try {
            await fs.remove(mockTemplatesDir)
        } catch {}
    })

    it('should list all predefined guidelines', () => {
        const list = guidelineRegistry.list()
        expect(list.length).toBeGreaterThan(0)
        expect(list.find(g => g.id === 'nextjs')).toBeDefined()
        expect(list.find(g => g.id === 'astro')).toBeDefined()
    })

    it('should retrieve a specific guideline by ID', () => {
        const next = guidelineRegistry.get('nextjs')
        expect(next).toBeDefined()
        expect(next?.name).toContain('Next.js')
    })

    it('should resolve template content', async () => {
        const guidelineId = 'nextjs'
        // We rely on real templates existing in src/templates if we pass that dir
        // Or we can mock the file system. Let's mock the file system for isolation.
        
        const guideline = guidelineRegistry.get(guidelineId)
        if (!guideline) throw new Error('Guideline not found')

        const templatePath = path.join(mockTemplatesDir, guideline.templateRelativePath)
        await fs.ensureDir(path.dirname(templatePath))
        await fs.writeFile(templatePath, '# Fake Template', 'utf-8')

        const content = await guidelineRegistry.resolveTemplate(guidelineId, mockTemplatesDir)
        expect(content).toBe('# Fake Template')
    })

    it('should throw error if template missing', async () => {
        await expect(
            guidelineRegistry.resolveTemplate('nextjs', mockTemplatesDir)
        ).rejects.toThrow('Guideline template not found')
    })
})
