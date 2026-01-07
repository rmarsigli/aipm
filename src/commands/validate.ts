/* eslint-disable no-console */
import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'

import { FILES } from '@/constants'

export async function validate(): Promise<void> {
    console.log(chalk.blue('Validating AIPM installation...'))

    const errors: string[] = []

    if (!(await fs.pathExists(path.join(process.cwd(), FILES.PROJECT_DIR)))) {
        errors.push(`Missing ${FILES.PROJECT_DIR} directory`)
    }

    if (!(await fs.pathExists(path.join(process.cwd(), FILES.PRE_SESSION_SCRIPT)))) {
        errors.push('Missing pre-session script')
    }

    if (errors.length > 0) {
        console.error(chalk.red('Validation failed:'))
        errors.forEach((e) => console.error(chalk.red(`- ${e}`)))
        process.exit(1)
    }

    console.log(chalk.green('✅ Validation passed'))
}
