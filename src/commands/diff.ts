/* eslint-disable no-console */
import chalk from 'chalk'

export async function diff(): Promise<void> {
    await Promise.resolve()
    console.log(chalk.blue('Running diff...'))
    // TODO: Full implementation requires regenerating prompts based on current config/detection
    // and comparing with file on disk.
    console.log(chalk.yellow('Diff functionality is experimental/stubbed.'))
}
