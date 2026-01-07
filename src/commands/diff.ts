import { logger } from '@/utils/logger.js'

export async function diff(): Promise<void> {
    await Promise.resolve()
    logger.info('Running diff...')
    // TODO: Full implementation requires regenerating prompts based on current config/detection
    // and comparing with file on disk.
    logger.warn('Diff functionality is experimental/stubbed.')
}
