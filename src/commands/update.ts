import { UpdateOptions } from '@/types/index.js'
import { install } from './install.js'
import { logger } from '@/utils/logger.js'

export async function update(options: UpdateOptions = {}): Promise<void> {
    logger.info('Updating AIPM...')

    // For now, update is essentially a re-install
    // In the future, this will be smarter about preserving custom content
    await install({
        ...options,
        yes: options.yes || options.force
    })

    logger.success('Update completed')
}
