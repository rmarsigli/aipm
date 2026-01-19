import { jest } from '@jest/globals'
import { join } from 'path'

// Mock dependencies using unstable_mockModule before import
jest.unstable_mockModule('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    readdirSync: jest.fn(),
    writeFileSync: jest.fn(),
}))

jest.unstable_mockModule('child_process', () => ({
    exec: jest.fn(),
}))

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        success: jest.fn(),
        warn: jest.fn(),
    }
}))

jest.unstable_mockModule('../../src/utils/template-engine.js', () => ({
    getTemplateVariables: jest.fn(),
    renderTemplate: jest.fn(),
}))

jest.unstable_mockModule('../../src/utils/clipboard.js', () => ({
    copyToClipboard: jest.fn(),
}))

jest.unstable_mockModule('chalk', () => ({
    default: {
        blue: Object.assign((s: string) => s, { bold: (s: string) => s }),
        gray: (s: string) => s,
        bold: (s: string) => s,
    }
}))

// Import dependencies AFTER mocking
const fs = await import('fs')
const loggerModule = await import('../../src/utils/logger.js')
const templateEngine = await import('../../src/utils/template-engine.js')
const clipboard = await import('../../src/utils/clipboard.js')
await import('chalk')
const { template } = await import('../../src/commands/template.js')

describe('template command', () => {
    let originalExit: any
    const mockLog = jest.fn()

    beforeAll(() => {
        originalExit = process.exit
        Object.defineProperty(process, 'exit', {
            value: ((code?: number) => {
                throw new Error(`process.exit: ${code}`)
            }) as any,
            writable: true
        })
    })

    afterAll(() => {
        if (originalExit) {
            process.exit = originalExit
        }
    })

    beforeEach(() => {
        jest.clearAllMocks()
        // Default mocks
        ;(fs.existsSync as jest.Mock).mockReturnValue(true)
        ;(fs.readdirSync as jest.Mock).mockReturnValue(['default.md', 'custom.md'])
        ;(fs.readFileSync as jest.Mock).mockReturnValue('Template Content')
        ;(templateEngine.renderTemplate as jest.Mock).mockReturnValue('Rendered Content')
        ;(clipboard.copyToClipboard as jest.Mock).mockResolvedValue(true as any)
    })
    
    test('lists templates implicitly when no name is provided', async () => {
        await template(undefined, { logger: { log: mockLog } })
        
        const output = mockLog.mock.calls.flat().join('\n')
        expect(output).toContain('Core Templates:')
        expect(output).toContain('default')
        expect(output).toContain('custom')
    })

    test('lists templates explicitly with --list', async () => {
        await template(undefined, { list: true, logger: { log: mockLog } })
        
        const output = mockLog.mock.calls.flat().join('\n')
        expect(output).toContain('Core Templates:')
        expect(output).toContain('default')
    })

    test('renders and copies a template to clipboard', async () => {
        await template('default', { logger: { log: mockLog } })
        
        expect(templateEngine.renderTemplate).toHaveBeenCalled()
        expect(clipboard.copyToClipboard).toHaveBeenCalledWith('Rendered Content')
        expect(loggerModule.logger.success).toHaveBeenCalledWith(expect.stringContaining('copied'))
    })

    test('renders and prints a template if --print is used', async () => {
        await template('default', { print: true, logger: { log: mockLog } })
        
        const output = mockLog.mock.calls.flat().join('\n')
        expect(output).toContain('Rendered Content')
        expect(clipboard.copyToClipboard).not.toHaveBeenCalled()
    })

    test('exits if template not found', async () => {
        ;(fs.existsSync as jest.Mock).mockImplementation(((path: string) => {
             // Mock directories to exist, but specific template files to missing
             if (path.endsWith('.md')) return false
             return true 
        }) as any)

        await expect(template('missing', { logger: { log: mockLog } }))
            .rejects.toThrow('process.exit: 1')
        
        expect(loggerModule.logger.error).toHaveBeenCalledWith(expect.stringContaining('not found'))
        // process.exit throw is caught by regex
    })
})
