import { createBackup } from '../src/core/installer.js'
import { createTempDir, cleanupTempDir } from './setup.js'
import fs from 'fs-extra'
import path from 'path'
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'

describe('createBackup', () => {
    let tempDir: string

    beforeEach(async () => {
        tempDir = await createTempDir()
    })

    afterEach(async () => {
        await cleanupTempDir(tempDir)
    })

    test('returns null if .project does not exist', async () => {
        const result = await createBackup(tempDir)
        expect(result).toBeNull()
    })

    test('creates backup of existing .project', async () => {
        const projectDir = path.join(tempDir, '.project')
        await fs.ensureDir(projectDir)
        await fs.writeFile(path.join(projectDir, 'test.txt'), 'content')

        const result = await createBackup(tempDir)
        
        expect(result).not.toBeNull()
        expect(result).toContain('.project-backups')
        
        // Verify content copied
        const backupFile = path.join(result as string, 'test.txt')
        expect(await fs.pathExists(backupFile)).toBe(true)
        expect(await fs.readFile(backupFile, 'utf-8')).toBe('content')
    })

    test('dry run returns path but does not create backup', async () => {
        const projectDir = path.join(tempDir, '.project')
        await fs.ensureDir(projectDir)

        const result = await createBackup(tempDir, true)
        
        expect(result).not.toBeNull()
        // Should not exist on disk
        expect(await fs.pathExists(result as string)).toBe(false)
    })
})
