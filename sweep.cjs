const path = require('path')
const { execFileSync } = require('child_process')

const first = process.env.FIRST || 'desktop'
const second = process.env.SECOND || 'mobile'

for (let n = 0; n <= 8; n++) {
  const code = `
    const path = require('path')
    const dir = ${JSON.stringify(path.join(__dirname, '.next/server/pages'))}
    const load = (p) => require(path.join(dir, p + '.js'))
    ;(async () => {
      const a = load(${JSON.stringify(first)})
      for (let i = 0; i < ${n}; i++) await Promise.resolve()
      const b = load(${JSON.stringify(second)})
      await Promise.all([a, b])
    })().then(
      () => console.log('OK'),
      (e) => { console.log('FAILED: ' + (e && e.message)); process.exitCode = 1 }
    )
  `
  let out
  try {
    out = execFileSync(process.execPath, ['-e', code], { encoding: 'utf8' }).trim()
  } catch (e) {
    out = (e.stdout || '').trim() || String(e.message).split('\n')[0]
  }
  console.log(`${first} -> ${n} microtask(s) -> ${second}: ${out}`)
}
