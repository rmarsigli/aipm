import fs from 'fs-extra'
import path from 'path'
import os from 'os'

export const createTempDir = async (): Promise<string> => {
    const tempDir = path.join(os.tmpdir(), `aipm-test-${Date.now()}`)
    await fs.ensureDir(tempDir)
    return tempDir
}

export const cleanupTempDir = async (dir: string): Promise<void> => {
    await fs.remove(dir)
}

// Mock console for silent tests
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
    jest.restoreAllMocks()
})
