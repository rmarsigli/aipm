/* eslint-disable no-console */
import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'

export async function validate(): Promise<void> {
    console.log(chalk.blue('Validating AIPM installation...'))

    const errors: string[] = []

    if (!(await fs.pathExists(path.join(process.cwd(), '.project')))) {
        errors.push('Missing .project directory')
    }

    if (!(await fs.pathExists(path.join(process.cwd(), '.project/scripts/pre-session.sh')))) {
        errors.push('Missing pre-session script')
    }

    if (errors.length > 0) {
        console.error(chalk.red('Validation failed:'))
        errors.forEach((e) => console.error(chalk.red(`- ${e}`)))
        process.exit(1)
    }

    console.log(chalk.green('✅ Validation passed'))
}
