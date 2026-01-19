import { Command } from 'commander'
import chalk from 'chalk'
import { getAllTasks, buildGraph } from '../utils/dependencies.js'

export const deps = new Command()
    .name('deps')
    .description('Visualize task dependency graph')
    .action(() => {
        const projectDir = process.cwd() // assume running in project root

        /* eslint-disable no-console */
        console.log(chalk.bold('\n🔗 Task Dependency Graph\n'))

        try {
            const allTasks = getAllTasks(projectDir)
            if (allTasks.length === 0) {
                console.log(chalk.yellow('No tasks found.'))
                return
            }

            const graph = buildGraph(allTasks)

            // Detect Cycles
            if (graph.cycles.length > 0) {
                console.log(chalk.red.bold('⚠️  Circular Dependencies Detected!\n'))
                graph.cycles.forEach((cycle) => {
                    console.log(chalk.red(`  ${cycle.join(' → ')}`))
                })
                console.log('')
            }

            // Simple visualization: List blocked vs ready vs in-progress
            // Group by status
            const completed = Array.from(graph.nodes.values()).filter((t) => t.status === 'completed')
            const inProgress = Array.from(graph.nodes.values()).filter((t) => t.status === 'in-progress')
            const blocked = Array.from(graph.nodes.values()).filter((t) => t.status === 'blocked')
            const backlog = Array.from(graph.nodes.values()).filter((t) => t.status === 'backlog')

            if (blocked.length > 0) {
                console.log(chalk.red.bold('🚫 Blocked Tasks:'))
                blocked.forEach((t) => {
                    console.log(chalk.red(`  ${t.id}: ${t.title}`))
                    // Removed unused 'missing' filter
                    t.dependsOn.forEach((d) => {
                        // Find status of D
                        let status = '?'
                        for (const [k, v] of graph.nodes) {
                            if (k === d || k.includes(d)) {
                                status = v.status
                                break
                            }
                        }

                        // Removed unused 'color' variable
                        console.log(chalk.gray(`     └─> ${d} [${status}]`))
                    })
                })
                console.log('')
            }

            if (inProgress.length > 0) {
                console.log(chalk.blue.bold('🔄 In Progress:'))
                inProgress.forEach((t) => {
                    console.log(chalk.blue(`  ${t.id}: ${t.title}`))
                })
                console.log('')
            }

            if (backlog.length > 0) {
                console.log(chalk.yellow.bold('⏳ Ready to Start (Backlog):'))
                backlog.forEach((t) => {
                    console.log(chalk.yellow(`  ${t.id}: ${t.title}`))
                })
                console.log('')
            }

            if (completed.length > 0) {
                console.log(chalk.green.bold('✅ Completed:'))
                completed.forEach((t) => {
                    console.log(chalk.green(`  ${t.id}: ${t.title}`))
                })
                console.log('')
            }
        } catch (error) {
            console.error(chalk.red('Error analyzing dependencies:'), error)
        }
        /* eslint-enable no-console */
    })
