import { jest } from '@jest/globals'

// Mock dependencies using unstable_mockModule for ESM support
jest.unstable_mockModule('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
}))

jest.unstable_mockModule('fs/promises', () => ({
    unlink: jest.fn(),
}))

jest.unstable_mockModule('../../src/utils/git.js', () => ({
    git: jest.fn(),
    gitLog: jest.fn(),
}))

jest.unstable_mockModule('@inquirer/prompts', () => ({
    confirm: jest.fn(),
}))

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        success: jest.fn(),
        warn: jest.fn(),
    }
}))

jest.unstable_mockModule('../../src/utils/context.js', () => ({
    parseContext: jest.fn(),
    parseTask: jest.fn(),
    calculateProgress: jest.fn(),
    extractCheckpoints: jest.fn(),
    extractObjective: jest.fn(),
}))

jest.unstable_mockModule('../../src/commands/start.js', () => ({
    start: jest.fn(),
}))

jest.unstable_mockModule('chalk', () => ({
    default: {
        blue: Object.assign((s: string) => s, { bold: (s: string) => s }),
        green: (s: string) => s,
        yellow: (s: string) => s,
        red: (s: string) => s,
        gray: (s: string) => s,
        cyan: (s: string) => s,
        bold: (s: string) => s,
    }
}))

// Import dependencies AFTER mocking
const fs = await import('fs')
const fsPromises = await import('fs/promises')
const gitUtils = await import('../../src/utils/git.js')
const inquirer = await import('@inquirer/prompts')
const loggerModule = await import('../../src/utils/logger.js')
const contextUtils = await import('../../src/utils/context.js')
const startCommand = await import('../../src/commands/start.js')
// Load chalk to ensure mock is applied
await import('chalk')
const { resume } = await import('../../src/commands/resume.js')

describe('resume command', () => {
    const mockExit = jest.spyOn(globalThis.process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit: ${code}`)
    }) as any)
    const mockLog = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        // Default mocks
        ;(fs.existsSync as jest.Mock).mockReturnValue(true) // .project exists
        ;(fs.readFileSync as jest.Mock).mockReturnValue('')
        ;(contextUtils.parseContext as jest.Mock).mockReturnValue({
            frontmatter: { last_updated: new Date().toISOString() },
        })
        ;(contextUtils.parseTask as jest.Mock).mockReturnValue({
            title: 'Test Task',
            status: 'in-progress',
            estimated_hours: 2,
        })
        ;(contextUtils.calculateProgress as jest.Mock).mockReturnValue({
            completed: 1,
            total: 2,
            percentage: 50,
        })
        ;(contextUtils.extractCheckpoints as jest.Mock).mockReturnValue({
            lastCompleted: ['Phase 1'],
            current: 'Phase 2',
            next: null,
        })
        ;(contextUtils.extractObjective as jest.Mock).mockReturnValue('Test Objective')
        ;(inquirer.confirm as jest.Mock).mockResolvedValue(true as never)
        ;(gitUtils.git as jest.Mock).mockResolvedValue('')
        ;(gitUtils.gitLog as jest.Mock).mockResolvedValue('')
        ;(fsPromises.unlink as jest.Mock).mockResolvedValue(undefined)
    })

    afterAll(() => {
        jest.restoreAllMocks()
    })

    test('exits if .project directory is missing', async () => {
        ;(fs.existsSync as jest.Mock).mockReturnValue(false)
        await expect(resume({ logger: { log: mockLog } })).rejects.toThrow('process.exit: 1')
        expect(loggerModule.logger.error).toHaveBeenCalledWith(expect.stringContaining('No .project directory found'))
        expect(mockExit).toHaveBeenCalledWith(1)
    })

    test('handles interruption snapshot', async () => {
        const snapshotMock = JSON.stringify({
            timestamp: new Date().toISOString(),
            reason: 'Test interruption',
            task: { title: 'Interrupted Task' }
        })

        ;(fs.existsSync as jest.Mock).mockImplementation(((path: string) => {
            if (path.includes('.interruption-snapshot')) return true
            return true
        }) as any)
        ;(fs.readFileSync as jest.Mock).mockReturnValue(snapshotMock)
        ;(inquirer.confirm as jest.Mock).mockResolvedValue(true as never) // Confirm restore

        await resume({ logger: { log: mockLog } })

        const output = mockLog.mock.calls.flat().join('\n')
        expect(output).toContain('Interruption Detected')
        expect(output).toContain('Interrupted Task')
        expect(startCommand.start).toHaveBeenCalled()
        expect(fsPromises.unlink).toHaveBeenCalled()
    })

    test('shows fresh session status correctly', async () => {
        // Last updated just now
        ;(contextUtils.parseContext as jest.Mock).mockReturnValue({
             frontmatter: { last_updated: new Date().toISOString() }
        })

        await resume({ logger: { log: mockLog }, auto: true })

        const output = mockLog.mock.calls.flat().join('\n')
        expect(output).toContain('[FRESH]')
    })

    test('shows active task details', async () => {
        await resume({ logger: { log: mockLog }, auto: true })

        const output = mockLog.mock.calls.flat().join('\n')
        expect(output).toContain('Test Task')
        expect(output).toContain('Progress: 1/2 checkboxes (50%)')
        expect(output).toContain('Phase 1')
        expect(output).toContain('Working on: Phase 2')
    })

    test('handles no active task', async () => {
        // Mock old session to avoid 'fresh' status
        const oldDate = new Date()
        oldDate.setHours(oldDate.getHours() - 2)
        ;(contextUtils.parseContext as jest.Mock).mockReturnValue({
             frontmatter: { last_updated: oldDate.toISOString() }
        })

        ;(fs.existsSync as jest.Mock).mockImplementation(((path: string) => {
             if (path.endsWith('.project')) return true
             if (path.endsWith('current-task.md')) return false // No task file
             return true
        }) as any)

        await resume({ logger: { log: mockLog }, auto: true })

        const output = mockLog.mock.calls.flat().join('\n')
        expect(output).toContain('No active task')
        expect(output).toContain('Run `aipim task list`')
    })

    test('skips confirmation prompt in auto mode', async () => {
        await resume({ logger: { log: mockLog }, auto: true })
        expect(inquirer.confirm).not.toHaveBeenCalled()
        expect(startCommand.start).toHaveBeenCalled()
    })

    test('asks for confirmation in interactive mode', async () => {
        await resume({ logger: { log: mockLog }, auto: false })
        expect(inquirer.confirm).toHaveBeenCalledWith(expect.objectContaining({ message: 'Ready to continue?' }))
        expect(startCommand.start).toHaveBeenCalled()
    })

    test('handles user rejection in interactive mode', async () => {
        ;(inquirer.confirm as jest.Mock).mockResolvedValue(false as never)
        await resume({ logger: { log: mockLog }, auto: false })
        expect(startCommand.start).not.toHaveBeenCalled()
        const output = mockLog.mock.calls.flat().join('\n')
        expect(output).toContain('Run `aipim start` when ready')
    })
})
