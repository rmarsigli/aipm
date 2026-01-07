import fs from 'fs-extra'
import path from 'path'
import { FILES } from '@/constants.js'
import { logger } from '@/utils/logger.js'

export async function validate(): Promise<void> {
    logger.info('Validating AIPM installation...')

    const errors: string[] = []

    if (!(await fs.pathExists(path.join(process.cwd(), FILES.PROJECT_DIR)))) {
        errors.push(`Missing ${FILES.PROJECT_DIR} directory`)
    }

    if (!(await fs.pathExists(path.join(process.cwd(), FILES.PRE_SESSION_SCRIPT)))) {
        errors.push('Missing pre-session script')
    }

    if (errors.length > 0) {
        logger.error('Validation failed:')
        errors.forEach((e) => logger.error(`- ${e}`))
        process.exit(1)
    }

    logger.success('Validation passed')
}
