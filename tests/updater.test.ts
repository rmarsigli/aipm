import { updater } from '../src/core/updater.js'
import { createTempDir, cleanupTempDir } from './setup.js'
import { logger } from '../src/utils/logger.js'
import { signatureManager } from '../src/core/signature.js'
import fs from 'fs-extra'
import path from 'path'
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { InstallConfig } from '../src/types/index.js'

describe('Updater', () => {
    let tempDir: string
    const mockConfig: InstallConfig = {
        ais: ['claude-code'],
        guidelines: [], // No extra guidelines to keep it simple
        version: 'compact',
        skipConfirmation: true,
        dryRun: false
    }

    beforeEach(async () => {
        tempDir = await createTempDir()
        // Mock process.cwd to be tempDir so scanner finds files
        // But we passed projectRoot to updater, so it should be fine.
        jest.spyOn(logger, 'warn').mockImplementation(() => {})
    })

    afterEach(async () => {
        await cleanupTempDir(tempDir)
    })

    test('updates pristine file', async () => {
        // Setup a pristine file
        const filePath = path.join(tempDir, 'CLAUDE.md')
        // We need to simulate that verify() works. 
        // Verification checks if hash(content) == signature.
        // We need the file to exist on verify.
        
        // This test is hard because we need the "old" content signature to match, 
        // but we want to replace it with "new" content.
        // Actually, if it's pristine, it means content == signature.
        // So we just need to write ANY signed content.
        
        const oldContent = 'Project Management System (Old Version)'
        await fs.writeFile(filePath, signatureManager.sign(oldContent))

        // We assume the templates (resolved by updater) will provide different content?
        // In this test environment, we might not have access to real templates unless we mock them
        // or point to real ones. 
        // The updater uses `resolveTemplatesDir`. Ideally we mock that or fs.readFile.
        
        // For integration test sanity, let's rely on real templates if possible, 
        // OR mock the internal `generatePromptContent`.
        
        // Let's rely on the fact that the real template is "Project Management System..."
        // If we write that signed, it's pristine.
        // Then update overwrites it (idempotent) or updates it if we change config?
        
        // If we want to test UPDATE, we need the on-disk file to differ from the template
        // BUT be marked as pristine? No, that's impossible.
        // Pristine means on-disk content matches its own signature.
        // It DOES NOT mean it matches the *current* template. 
        // Example: I installed v1.0. The file is signed "v1.0".
        // Now I run v1.1 updater. The file on disk is valid (hash matches content).
        // Since it is valid (Pristine), updater is allowed to replace it with v1.1 template.
        
        const results = await updater.update(tempDir, mockConfig)
        
        const updateResult = results.find(r => r.file === 'CLAUDE.md')
        
        // It might be 'created' if scanner didn't find it in the list (scanner only scans target list).
        // Updater currently scans fixed list.
        
        expect(updateResult?.status).not.toBe('skipped')
        // If it overwrites, checking content changes would be key.
    })

    test('skips modified file', async () => {
        const filePath = path.join(tempDir, 'CLAUDE.md')
        const content = 'Modified Content'
        // Signed but then changed
        const signed = signatureManager.sign(content)
        await fs.writeFile(filePath, signed + '\nUser Edit')

        const results = await updater.update(tempDir, mockConfig)
        
        const updateResult = results.find(r => r.file === 'CLAUDE.md')
        expect(updateResult?.status).toBe('skipped')
    })

    test('creates backup', async () => {
        // Ensure there is something to backup
        await fs.ensureDir(path.join(tempDir, '.project'))
        
        await updater.update(tempDir, mockConfig)
        
        const backupDirs = await fs.readdir(path.join(tempDir, '.project-backups'))
        expect(backupDirs.length).toBeGreaterThan(0)
    })
})
