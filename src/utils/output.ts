/* eslint-disable no-console */

/**
 * Output utility for CLI content display.
 *
 * Separated from logger.ts to distinguish between:
 * - logger: System messages (info, error, warn, debug) - for operational logging
 * - output: User content (prompts, templates, lists) - for CLI output
 *
 * This separation improves:
 * - Code clarity: Different semantic purposes
 * - Testability: Easy to mock without affecting system logging
 * - Maintainability: Can extend output behavior without touching logger
 */
class Output {
    /**
     * Prints content to stdout.
     * Used for displaying user-facing content like prompts, templates, and formatted output.
     *
     * @param message - The content to print
     */
    public print(message: string): void {
        console.log(message)
    }
}

export const output = new Output()
