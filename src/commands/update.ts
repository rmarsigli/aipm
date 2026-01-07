/* eslint-disable no-console */
import chalk from 'chalk'
import { UpdateOptions } from '@/types'
import { install } from './install'

export async function update(options: UpdateOptions = {}): Promise<void> {
    console.log(chalk.blue('Updating AIPM...'))

    // For now, update is essentially a re-install
    // In the future, this will be smarter about preserving custom content
    await install({
        ...options,
        yes: options.yes || options.force
    })

    console.log(chalk.green('\n✅ Update completed'))
}
