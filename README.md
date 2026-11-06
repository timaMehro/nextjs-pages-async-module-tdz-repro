# Pages Router: a page shared between two entries can be read before it finishes evaluating

A Pages Router page that re-exports `getServerSideProps` from another page ends
up with that whole page module compiled into both page bundles. Both bundles
load through one `webpack-runtime.js` with one module cache, so the second
entry gets a cache hit on the first entry's instance. If that module is async,
the second entry can read its exports while the module body has not run yet.

```
ReferenceError: Cannot access 'i' before initialization
    at Module.default (.next/server/pages/desktop.js:1:385)
    at a (.next/server/chunks/206.js:8:2991)          <- hoist() from build/templates/helpers.ts
    at .next/server/pages/mobile.js:1:1306            <- hoist(userland, 'default') in the route module
    at i.a (.next/server/webpack-runtime.js:1:665)    <- __webpack_require__.a
    at 9409 (.next/server/pages/mobile.js:1:825)      <- the route module factory
```

## Reproduce

```bash
npm install
npm run build
npm run repro     # FAILED: Cannot access 'i' before initialization
```

`repro.cjs` enters the two page bundles the way a server does when it loads two
routes, with a delay of N microtasks between them. `npm run sweep` walks N from
0 to 8:

```
desktop -> 0 microtask(s) -> mobile: OK
desktop -> 1 microtask(s) -> mobile: FAILED: Cannot access 'i' before initialization
desktop -> 2 microtask(s) -> mobile: OK
...
```

One microtask is the whole window: long enough for the shared module's async
dependency to resolve, short enough that the module's own continuation has not
run.

## The module graph

```
lib/async-dep.mjs   top-level await                  -> async, has its own queue
pages/mobile.js     imports it, no top-level await   -> async, forwards the queue only
pages/desktop.js    export { getServerSideProps } from './mobile'
```

`pages/mobile.js` is compiled into **both** `pages/desktop.js` and
`pages/mobile.js`, byte for byte, under one shared runtime:

```js
2234:(a,b,c)=>{c.a(a,async(a,d)=>{try{
  c.r(b),c.d(b,{default:()=>i,getServerSideProps:()=>h});   // getters installed up front
  var e=c(8732),f=c(1102),g=a([f]);
  async function h(){...}
  f=(g.then?(await g)():g)[0];                              // <- window opens here
  let i=({label:a})=>...;                                   // <- `i` assigned only now
  d()
}catch(a){d(a)}})}
```

Two details make the window observable:

1. The default export is a `const` arrow, so its binding is a `let` in the
   output. Change it to `export default function Mobile() {}` and the
   declaration hoists, the binding is never in a dead zone, and nothing throws.
2. `hoist()` in `build/templates/helpers.ts` starts with `if (name in module)`.
   `__webpack_require__.d` installs the getters before the module body runs, so
   that test is always true and the getter is always evaluated.

## Expected

The route module should not observe the exports of a shared module that has not
finished evaluating. Loading two routes in either order, with any delay between
them, should behave the same as loading them sequentially.

## Versions

Both fail identically:

- `next@16.4.4`
- `next@16.5.0-canary.42`

`next build --webpack`, Node 24.9.0, macOS arm64. Not tested with Turbopack.

## Related

[#100385](https://github.com/vercel/next.js/issues/100385) reports the same
class of problem in the Turbopack runtime: a dependent of an async module
without a top-level await reads its exports before they are registered.
