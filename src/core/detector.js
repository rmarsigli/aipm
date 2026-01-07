const fs = require('fs-extra');
const path = require('path');

const FRAMEWORK_SIGNATURES = [
    { id: 'astro', name: 'Astro', check: (pkg) => hasDep(pkg, 'astro') || hasFile('astro.config.mjs') || hasFile('astro.config.js') },
    { id: 'nextjs', name: 'Next.js', check: (pkg) => hasDep(pkg, 'next') || hasFile('next.config.js') },
    { id: 'react-vite', name: 'React (Vite)', check: (pkg) => hasDep(pkg, 'react') && hasFile('vite.config.js') },
    { id: 'react-cra', name: 'React (CRA)', check: (pkg) => hasDep(pkg, 'react') && hasDep(pkg, 'react-scripts') },
    { id: 'react', name: 'React', check: (pkg) => hasDep(pkg, 'react') },
    { id: 'vue', name: 'Vue', check: (pkg) => hasDep(pkg, 'vue') },
    { id: 'svelte', name: 'Svelte', check: (pkg) => hasDep(pkg, 'svelte') },
];

const LOCK_FILES = {
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'package-lock.json': 'npm',
    'bun.lockb': 'bun'
};

const PROMPT_FILES = ['CLAUDE.md', 'GEMINI.md', 'CHATGPT.md'];

async function detectProject(cwd = process.cwd()) {
    const pkgPath = path.join(cwd, 'package.json');
    const pkg = (await fs.pathExists(pkgPath)) ? await fs.readJson(pkgPath) : null;
    
    const [hasGit, hasNodeModules, hasProject, promptFiles] = await Promise.all([
        fs.pathExists(path.join(cwd, '.git')),
        fs.pathExists(path.join(cwd, 'node_modules')),
        fs.pathExists(path.join(cwd, '.project')),
        filterExistingFiles(cwd, PROMPT_FILES)
    ]);

    return {
        ...detectFramework(pkg),
        packageManager: await detectPackageManager(cwd),
        hasGit,
        hasNodeModules,
        existingSetup: {
            hasProject,
            hasPrompts: promptFiles
        }
    };
}

function detectFramework(pkg) {
    if (!pkg) return { framework: null, frameworkVersion: null };

    const match = FRAMEWORK_SIGNATURES.find(sig => sig.check(pkg));
    
    if (!match) return { framework: null, frameworkVersion: null };

    // Try to get version from dependencies or devDependencies
    const version = getDepVersion(pkg, match.id) || getDepVersion(pkg, match.id.split('-')[0]);

    return {
        framework: match.id,
        frameworkVersion: version
    };
}

async function detectPackageManager(cwd) {
    for (const [file, manager] of Object.entries(LOCK_FILES)) {
        if (await fs.pathExists(path.join(cwd, file))) return manager;
    }
    return null;
}

// Helpers
const hasDep = (pkg, name) => pkg?.dependencies?.[name] || pkg?.devDependencies?.[name];
const hasFile = (filename) => fs.pathExistsSync(filename); // Note: Sync for simplicity in config, but could be async if needed
const getDepVersion = (pkg, name) => pkg?.dependencies?.[name] || pkg?.devDependencies?.[name];

async function filterExistingFiles(cwd, files) {
    const existing = [];
    for (const file of files) {
        if (await fs.pathExists(path.join(cwd, file))) existing.push(file);
    }
    return existing;
}

function getFrameworkDisplayName(frameworkId) {
    return FRAMEWORK_SIGNATURES.find(f => f.id === frameworkId)?.name || frameworkId;
}

module.exports = {
    detectProject,
    getFrameworkDisplayName
};