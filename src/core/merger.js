const fs = require('fs-extra');
const path = require('path');

async function mergeGuidelines(basePrompt, guidelines, templatesDir) {
    const guidelineContents = [];

    for (const guideline of guidelines) {
        const guidelinePath = path.join(templatesDir, `guidelines/${guideline}.md`);

        if (await fs.pathExists(guidelinePath)) {
            const content = await fs.readFile(guidelinePath, 'utf-8');
            guidelineContents.push(content);
        }
    }

    if (guidelineContents.length === 0) {
        return basePrompt;
    }

    const mergedGuidelines = guidelineContents.join('\n\n---\n\n');

    const merged = basePrompt.replace(
        /{{SLOT:guidelines}}[\s\S]*?{{\/SLOT:guidelines}}/,
        `{{SLOT:guidelines}}\n\n${mergedGuidelines}\n\n{{/SLOT:guidelines}}`
    );

    return merged;
}

module.exports = {
    mergeGuidelines
};