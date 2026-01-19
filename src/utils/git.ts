import { spawn } from 'child_process'

export interface GitResult {
    stdout: string
    stderr: string
    code: number
}

export async function git(args: string[], cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn('git', args, { cwd: cwd || process.cwd() })
        let stdout = ''
        let stderr = ''

        proc.stdout.on('data', (data: Buffer) => {
            stdout += data.toString()
        })

        proc.stderr.on('data', (data: Buffer) => {
            stderr += data.toString()
        })

        proc.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`git ${args.join(' ')} failed: ${stderr.trim() || stdout.trim()}`))
            } else {
                resolve(stdout.trim())
            }
        })

        proc.on('error', (err) => {
            reject(new Error(`Failed to spawn git: ${err.message}`))
        })
    })
}

export async function gitSafe(args: string[], fallback: string, cwd?: string): Promise<string> {
    try {
        return await git(args, cwd)
    } catch {
        return fallback
    }
}

export async function gitBranch(cwd?: string): Promise<string> {
    return gitSafe(['rev-parse', '--abbrev-ref', 'HEAD'], 'unknown', cwd)
}

export async function gitLog(count: number, format: string, cwd?: string): Promise<string> {
    return gitSafe(['log', `-${count}`, `--pretty=format:${format}`], '', cwd)
}

export async function gitDiff(cwd?: string): Promise<string> {
    return gitSafe(['diff', '--stat'], 'No changes', cwd)
}

export async function gitLogToday(cwd?: string): Promise<string> {
    return gitSafe(['log', '--since=midnight', '--oneline'], 'No commits today', cwd)
}

export async function gitLastCommit(cwd?: string): Promise<string> {
    return gitSafe(['log', '-1', '--oneline'], '', cwd)
}
