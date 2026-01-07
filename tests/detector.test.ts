import { detectProject, getFrameworkDisplayName } from '../src/core/detector'
import { createTempDir, cleanupTempDir } from './setup'
import fs from 'fs-extra'
import path from 'path'

describe('detectProject', () => {
    let tempDir: string
    let originalCwd: string

    beforeEach(async () => {
        originalCwd = process.cwd()
        tempDir = await createTempDir()
        process.chdir(tempDir)
    })

    afterEach(async () => {
        process.chdir(originalCwd)
        await cleanupTempDir(tempDir)
    })

    describe('framework detection', () => {
        test('detects React with Vite', async () => {
            await fs.writeJson(path.join(tempDir, 'package.json'), {
                dependencies: { react: '^18.0.0' }
            })
            await fs.writeFile(path.join(tempDir, 'vite.config.js'), '')

            const result = await detectProject(tempDir)

            expect(result.framework).toBe('react-vite')
            expect(result.frameworkVersion).toBe('^18.0.0')
        })

        test('detects React with CRA', async () => {
            await fs.writeJson(path.join(tempDir, 'package.json'), {
                dependencies: { react: '^18.0.0', 'react-scripts': '^5.0.0' }
            })

            const result = await detectProject(tempDir)

            expect(result.framework).toBe('react-cra')
        })

        test('detects Astro', async () => {
            await fs.writeJson(path.join(tempDir, 'package.json'), {
                dependencies: { astro: '^4.0.0' }
            })

            const result = await detectProject(tempDir)

            expect(result.framework).toBe('astro')
        })

        test('detects Next.js', async () => {
            await fs.writeJson(path.join(tempDir, 'package.json'), {
                dependencies: { next: '^14.0.0' }
            })

            const result = await detectProject(tempDir)

            expect(result.framework).toBe('nextjs')
        })

        test('detects Vue', async () => {
            await fs.writeJson(path.join(tempDir, 'package.json'), {
                dependencies: { vue: '^3.0.0' }
            })

            const result = await detectProject(tempDir)

            expect(result.framework).toBe('vue')
        })

        test('detects Svelte', async () => {
            await fs.writeJson(path.join(tempDir, 'package.json'), {
                dependencies: { svelte: '^4.0.0' }
            })

            const result = await detectProject(tempDir)

            expect(result.framework).toBe('svelte')
        })

        test('returns null for unknown framework', async () => {
            await fs.writeJson(path.join(tempDir, 'package.json'), {
                dependencies: { express: '^4.0.0' }
            })

            const result = await detectProject(tempDir)

            expect(result.framework).toBeNull()
        })

        test('handles missing package.json', async () => {
            const result = await detectProject(tempDir)

            expect(result.framework).toBeNull()
            expect(result.frameworkVersion).toBeNull()
        })
    })

    describe('package manager detection', () => {
        test('detects pnpm', async () => {
            await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '')

            const result = await detectProject(tempDir)

            expect(result.packageManager).toBe('pnpm')
        })

        test('detects yarn', async () => {
            await fs.writeFile(path.join(tempDir, 'yarn.lock'), '')

            const result = await detectProject(tempDir)

            expect(result.packageManager).toBe('yarn')
        })

        test('detects npm', async () => {
            await fs.writeFile(path.join(tempDir, 'package-lock.json'), '')

            const result = await detectProject(tempDir)

            expect(result.packageManager).toBe('npm')
        })

        test('detects bun', async () => {
            await fs.writeFile(path.join(tempDir, 'bun.lockb'), '')

            const result = await detectProject(tempDir)

            expect(result.packageManager).toBe('bun')
        })

        test('returns null when no lock file', async () => {
            const result = await detectProject(tempDir)

            expect(result.packageManager).toBeNull()
        })
    })

    describe('existing setup detection', () => {
        test('detects .project directory', async () => {
            await fs.ensureDir(path.join(tempDir, '.project'))

            const result = await detectProject(tempDir)

            expect(result.existingSetup.hasProject).toBe(true)
        })

        test('detects prompt files', async () => {
            await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '')
            await fs.writeFile(path.join(tempDir, 'GEMINI.md'), '')

            const result = await detectProject(tempDir)

            expect(result.existingSetup.hasPrompts).toContain('CLAUDE.md')
            expect(result.existingSetup.hasPrompts).toContain('GEMINI.md')
        })

        test('detects git repository', async () => {
            await fs.ensureDir(path.join(tempDir, '.git'))

            const result = await detectProject(tempDir)

            expect(result.hasGit).toBe(true)
        })

        test('detects node_modules', async () => {
            await fs.ensureDir(path.join(tempDir, 'node_modules'))

            const result = await detectProject(tempDir)

            expect(result.hasNodeModules).toBe(true)
        })
    })
})

describe('getFrameworkDisplayName', () => {
    test('returns display name for known framework', () => {
        expect(getFrameworkDisplayName('react-vite')).toBe('React (Vite)')
        expect(getFrameworkDisplayName('nextjs')).toBe('Next.js')
        expect(getFrameworkDisplayName('astro')).toBe('Astro')
    })

    test('returns empty string for null', () => {
        expect(getFrameworkDisplayName(null)).toBe('')
    })

    test('returns id for unknown framework', () => {
        expect(getFrameworkDisplayName('unknown')).toBe('unknown')
    })
})
