
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '../dist/cli.js');
const BASE_CMD = `node ${CLI_PATH}`;

const scenarios = [
    {
        name: '1-default-compact',
        cmd: `${BASE_CMD} install --yes --ai claude-code`,
        expectFiles: ['CLAUDE.md'],
        expectContent: { 'CLAUDE.md': 'compact' } // rudimentary check
    },
    {
        name: '2-explicit-full',
        cmd: `${BASE_CMD} install --yes --ai claude-code --full`,
        expectFiles: ['CLAUDE.md'],
        // full prompt is larger, maybe check size or specific string?
    },
    {
        name: '3-multi-ai',
        cmd: `${BASE_CMD} install --yes --ai claude-code gemini`,
        expectFiles: ['CLAUDE.md', 'GEMINI.md']
    },
    {
        name: '4-guidelines-react',
        cmd: `${BASE_CMD} install --yes --ai claude-code --guidelines react`,
        expectFiles: ['CLAUDE.md'],
        expectContent: { 'CLAUDE.md': 'React' }
    },
    {
        name: '5-guidelines-astro',
        cmd: `${BASE_CMD} install --yes --ai claude-code --guidelines astro`,
        expectFiles: ['CLAUDE.md'],
        expectContent: { 'CLAUDE.md': 'Astro' }
    },
    {
        name: '6-guidelines-nextjs',
        cmd: `${BASE_CMD} install --yes --ai claude-code --guidelines nextjs`,
        expectFiles: ['CLAUDE.md'],
        expectContent: { 'CLAUDE.md': 'Next.js' }
    },
    {
        name: '7-guidelines-vue',
        cmd: `${BASE_CMD} install --yes --ai claude-code --guidelines vue`,
        expectFiles: ['CLAUDE.md'],
        expectContent: { 'CLAUDE.md': 'Vue' }
    },
    {
        name: '8-dry-run',
        cmd: `${BASE_CMD} install --dry-run --yes --ai claude-code`,
        expectFiles: [],
        mustNotExist: ['.project', 'CLAUDE.md']
    },
    {
        name: '9-update-force',
        cmd: `${BASE_CMD} install --yes --ai claude-code && ${BASE_CMD} update --force --ai claude-code`,
        expectFiles: ['CLAUDE.md']
    },
    {
        name: '10-completion',
        cmd: `${BASE_CMD} completion`,
        expectStdout: 'complete -F _aipm_completion aipm'
    }
];

console.log('🧪 Starting Comprehensive Lab Tests...\n');

let passed = 0;
let failed = 0;

for (const scenario of scenarios) {
    const testDir = path.join(__dirname, scenario.name);
    
    // Cleanup and create test dir
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir);

    console.log(`Running: ${scenario.name}...`);
    
    try {
        const output = execSync(scenario.cmd, { cwd: testDir, encoding: 'utf-8', stdio: 'pipe' });
        
        // Assertions
        let scenarioFailed = false;

        // Check file existence
        if (scenario.expectFiles) {
            for (const file of scenario.expectFiles) {
                const filePath = path.join(testDir, file);
                if (!fs.existsSync(filePath)) {
                    console.error(`  ❌ Missing expected file: ${file}`);
                    scenarioFailed = true;
                }
            }
        }

        // Check for files that MUST NOT exist
        if (scenario.mustNotExist) {
             for (const file of scenario.mustNotExist) {
                const filePath = path.join(testDir, file);
                if (fs.existsSync(filePath)) {
                    console.error(`  ❌ File exists but check forbade it: ${file}`);
                    scenarioFailed = true;
                }
            }
        }

        // Check content
        if (scenario.expectContent) {
            for (const [file, content] of Object.entries(scenario.expectContent)) {
                 const filePath = path.join(testDir, file);
                 if (fs.existsSync(filePath)) {
                     const actual = fs.readFileSync(filePath, 'utf-8');
                     if (!actual.includes(content)) {
                         console.error(`  ❌ Content verification failed in ${file}. Expected to contain: "${content}"`);
                         scenarioFailed = true;
                     }
                 }
            }
        }

        // Check stdout
        if (scenario.expectStdout) {
            if (!output.includes(scenario.expectStdout)) {
                 console.error(`  ❌ Stdout verification failed. Expected to contain: "${scenario.expectStdout}"`);
                 scenarioFailed = true;
            }
        }

        if (scenarioFailed) {
            failed++;
            console.log(`  ❌ FAILED`);
        } else {
            passed++;
            console.log(`  ✅ PASSED`);
        }

    } catch (e) {
        console.error(`  ❌ CRASHED: ${e.message}`);
        console.error(e.stdout)
        console.error(e.stderr)
        failed++;
    }
}

console.log(`\nResults: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
