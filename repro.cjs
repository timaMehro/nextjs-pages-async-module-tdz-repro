const path = require('path')
const dir = path.join(__dirname, '.next/server/pages')
const load = (page) => require(path.join(dir, `${page}.js`))

// Delay in microtasks between entering the two page bundles. One microtask is
// the window in which the shared page module has had its exports declared but
// has not yet run its body.
const delay = Number(process.argv[2] ?? 1)

;(async () => {
  const desktop = load('desktop')
  for (let i = 0; i < delay; i++) await Promise.resolve()
  const mobile = load('mobile')
  await Promise.all([desktop, mobile])
})().then(
  () => console.log(`delay=${delay}: evaluated OK`),
  (err) => {
    console.log(`delay=${delay}: FAILED`)
    console.log(err.stack)
    process.exitCode = 1
  }
)
