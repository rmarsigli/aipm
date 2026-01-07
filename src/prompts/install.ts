/* eslint-disable no-console */
import inquirer from 'inquirer'
import chalk from 'chalk'
import { DetectedProject, InstallConfig } from '@/types'
import { AI_TOOLS, PROMPTS } from '@/constants'

export async function promptConfiguration(
    detected: DetectedProject,
    options: Partial<InstallConfig> & { yes?: boolean } = {}
): Promise<InstallConfig | null> {
    console.log(chalk.blue('\n📋 Installation Options\n'))

    const { ais } = await inquirer.prompt<{ ais: string[] }>([
        {
            type: 'checkbox',
            name: 'ais',
            message: 'Which AI tools will you use?',
            choices: [
                { name: 'Claude Code (terminal AI assistant)', value: AI_TOOLS.CLAUDE_CODE, checked: true },
                { name: 'Claude.ai (web interface)', value: AI_TOOLS.CLAUDE_AI, checked: true },
                { name: 'Google Gemini', value: AI_TOOLS.GEMINI, checked: false },
                { name: 'ChatGPT', value: AI_TOOLS.CHATGPT, checked: false }
            ],
            validate: (answer: string[]): boolean | string => {
                if (answer.length < 1) {
                    return 'You must choose at least one AI tool.'
                }
                return true
            }
        }
    ])

    const guidelineChoices = [
        { name: 'React', value: 'react', checked: detected.framework?.includes('react') },
        { name: 'Astro', value: 'astro', checked: detected.framework === 'astro' },
        { name: 'Next.js', value: 'nextjs', checked: detected.framework === 'nextjs' },
        { name: 'Vue', value: 'vue', checked: detected.framework === 'vue' }
    ]

    const { guidelines } = await inquirer.prompt<{ guidelines: string[] }>([
        {
            type: 'checkbox',
            name: 'guidelines',
            message: 'Add framework-specific guidelines?',
            choices: guidelineChoices
        }
    ])

    const { version } = await inquirer.prompt<{ version: 'compact' | 'full' }>([
        {
            type: 'list',
            name: 'version',
            message: 'Choose system version:',
            choices: [
                {
                    name: 'Compact (1,000 tokens, optimized) [RECOMMENDED]',
                    value: 'compact',
                    short: 'Compact'
                },
                {
                    name: 'Full (4,000 tokens, comprehensive)',
                    value: 'full',
                    short: 'Full'
                }
            ],
            default: 'compact'
        }
    ])

    if (!options.yes) {
        console.log(chalk.blue('\n📄 Installation Summary\n'))
        console.log('Files to be created:')
        console.log(chalk.gray('  • .project/ (directory structure)'))

        const tokens = version === 'compact' ? '~1,000' : '~4,000'
        ais.forEach((ai: string) => {
            const filename = getPromptFilename(ai)
            console.log(chalk.gray(`  • ${filename} (${tokens} tokens${guidelines.length > 0 ? ' + guidelines' : ''})`))
        })

        const existingFiles = detected.existingSetup.hasPrompts
        if (existingFiles.length > 0) {
            console.log(chalk.yellow('\n⚠️  Warning: This will replace existing files:'))
            existingFiles.forEach((f: string) => console.log(chalk.yellow(`   • ${f}`)))
        }

        const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Proceed with installation?',
                default: true
            }
        ])

        if (!confirm) {
            return null
        }
    }

    return {
        ais,
        guidelines,
        version,
        skipConfirmation: options.yes || false
    }
}

function getPromptFilename(ai: string): string {
    const filenames: Record<string, string> = {
        [AI_TOOLS.CLAUDE_CODE]: PROMPTS.CLAUDE,
        [AI_TOOLS.CLAUDE_AI]: PROMPTS.CLAUDE,
        [AI_TOOLS.GEMINI]: PROMPTS.GEMINI,
        [AI_TOOLS.CHATGPT]: PROMPTS.CHATGPT
    }

    return filenames[ai] || `${ai.toUpperCase()}.md`
}
