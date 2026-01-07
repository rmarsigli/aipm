import { projectScanner } from '../src/core/scanner.js'
import { signatureManager } from '../src/core/signature.js'
import { createTempDir, cleanupTempDir } from './setup.js'
import fs from 'fs-extra'
import path from 'path'
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'

describe('ProjectScanner', () => {
    let tempDir: string

    beforeEach(async () => {
        tempDir = await createTempDir()
    })

    afterEach(async () => {
        await cleanupTempDir(tempDir)
    })

    test('classifies missing files correctly', async () => {
        const results = await projectScanner.scan(tempDir, ['missing.md'])
        expect(results[0].status).toBe('missing')
    })

    test('classifies pristine files correctly', async () => {
        const filePath = path.join(tempDir, 'pristine.md')
        const content = '# Original Content'
        const signed = signatureManager.sign(content)
        
        await fs.writeFile(filePath, signed)
        
        const results = await projectScanner.scan(tempDir, ['pristine.md'])
        expect(results[0].status).toBe('pristine')
    })

    test('classifies modified files correctly', async () => {
        const filePath = path.join(tempDir, 'modified.md')
        const content = '# Original Content'
        const signed = signatureManager.sign(content)
        
        // Simulating user edit
        const modified = signed + '\nUser edit'
        await fs.writeFile(filePath, modified)
        
        const results = await projectScanner.scan(tempDir, ['modified.md'])
        expect(results[0].status).toBe('modified')
    })

    test('classifies legacy files correctly', async () => {
        const filePath = path.join(tempDir, 'legacy.md')
        await fs.writeFile(filePath, '# No Signature')
        
        const results = await projectScanner.scan(tempDir, ['legacy.md'])
        expect(results[0].status).toBe('legacy')
    })
})
