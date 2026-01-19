import { ProjectScanner } from '../src/core/scanner.js'
import { performance } from 'perf_hooks'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'

async function benchmark() {
  const scanner = new ProjectScanner()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aipim-bench-'))
  const FILES_COUNT = 100

  console.log(`Setting up ${FILES_COUNT} files in ${tempDir}...`)
  
  const files: string[] = []
  for (let i = 0; i < FILES_COUNT; i++) {
    const filename = `bench-${i}.md`
    files.push(filename)
    await fs.writeFile(path.join(tempDir, filename), `# Benchmark File ${i}`)
  }

  console.log('Starting scan...')
  const start = performance.now()
  const results = await scanner.scan(tempDir, files)
  const end = performance.now()

  console.log(`Scanned ${results.length} files in ${(end - start).toFixed(2)}ms`)

  await fs.remove(tempDir)
}

benchmark().catch(console.error)
