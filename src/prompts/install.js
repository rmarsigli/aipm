const inquirer = require('inquirer');
const chalk = require('chalk');
const { getFrameworkDisplayName } = require('../core/detector');

async function promptConfiguration(detected, options = {}) {
    console.log(chalk.blue('\n📋 Installation Options\n'));
  
    const { ais } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'ais',
        message: 'Which AI tools will you use?',
        choices: [
            { name: 'Claude Code (terminal AI assistant)', value: 'claude-code', checked: true },
            { name: 'Claude.ai (web interface)', value: 'claude-ai', checked: true },
            { name: 'Google Gemini', value: 'gemini', checked: false },
            { name: 'ChatGPT', value: 'chatgpt', checked: false }
        ],
        validate: (answer) => {
            if (answer.length < 1) {
                return 'You must choose at least one AI tool.';
            }
            return true;
        }
    }]);
  
    const guidelineChoices = [
        { name: 'React', value: 'react', checked: detected.framework?.includes('react') },
        { name: 'Astro', value: 'astro', checked: detected.framework === 'astro' },
        { name: 'Next.js', value: 'nextjs', checked: detected.framework === 'nextjs' },
        { name: 'Vue', value: 'vue', checked: detected.framework === 'vue' }
    ];
  
    const { guidelines } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'guidelines',
        message: 'Add framework-specific guidelines?',
        choices: guidelineChoices
    }]);
  
    const { version } = await inquirer.prompt([{
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
    }]);
  
    if (!options.yes) {
        console.log(chalk.blue('\n📄 Installation Summary\n'));
        console.log('Files to be created:');
        console.log(chalk.gray('  • .project/ (directory structure)'));
    
        const tokens = version === 'compact' ? '~1,000' : '~4,000';
        ais.forEach(ai => {
            const filename = getPromptFilename(ai);
            console.log(chalk.gray(`  • ${filename} (${tokens} tokens${guidelines.length > 0 ? ' + guidelines' : ''})`));
        });
    
        const existingFiles = detected.existingSetup.hasPrompts;
        if (existingFiles.length > 0) {
            console.log(chalk.yellow('\n⚠️  Warning: This will replace existing files:'));
            existingFiles.forEach(f => console.log(chalk.yellow(`   • ${f}`)));
        }
    
        const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: 'Proceed with installation?',
            default: true
        }]);
    
        if (!confirm) {
            return null;
        }
    }
  
    return {
        ais,
        guidelines,
        version,
        skipConfirmation: options.yes
    };
}

function getPromptFilename(ai) {
  const filenames = {
    'claude-code': 'CLAUDE.md',
    'claude-ai': 'CLAUDE.md',
    'gemini': 'GEMINI.md',
    'chatgpt': 'CHATGPT.md'
  };
  
    return filenames[ai] || `${ai.toUpperCase()}.md`;
}

module.exports = {
    promptConfiguration
};