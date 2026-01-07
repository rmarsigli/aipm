const fs = require('fs-extra');
const path = require('path');
const { mergeGuidelines } = require('./merger');

async function installProject(config, detected) {
    const templatesDir = path.join(__dirname, '../../templates');

    await createProjectStructure(templatesDir);

    for (const ai of config.ais) {
        await generatePrompt(ai, config, templatesDir);
    }

    await makeScriptsExecutable();
}

async function createProjectStructure(templatesDir) {
    const baseDir = path.join(templatesDir, 'base/.project');
    const targetDir = '.project';

    await fs.copy(baseDir, targetDir, {
        overwrite: false,
        errorOnExist: false
    });

    const dirs = [
        'backlog',
        'completed',
        'decisions',
        'docs',
        'ideas',
        'reports'
    ];

    for (const dir of dirs) {
        await fs.ensureDir(path.join(targetDir, dir));
    }
}

async function generatePrompt(ai, config, templatesDir) {
    const basePath = path.join(templatesDir, 'base/project-manager.md');
    let basePrompt = await fs.readFile(basePath, 'utf-8');
    
    if (config.guidelines && config.guidelines.length > 0) {
        basePrompt = await mergeGuidelines(basePrompt, config.guidelines, templatesDir);
    }

    const filename = getPromptFilename(ai);

    await fs.writeFile(filename, basePrompt, 'utf-8');
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

async function makeScriptsExecutable() {
    const scripts = [
        '.project/scripts/pre-session.sh',
        '.project/scripts/validate-dod.sh'
    ];

    for (const script of scripts) {
        if (await fs.pathExists(script)) {
            await fs.chmod(script, '755');
        }
    }
}

module.exports = {
    installProject,
    createProjectStructure,
    generatePrompt,
    makeScriptsExecutable
};