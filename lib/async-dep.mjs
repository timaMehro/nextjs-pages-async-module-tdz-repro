// A top-level await makes every module that imports this an async module,
// exactly as an ESM-only dependency does once webpack compiles it.
export const label = await Promise.resolve('from the async dependency')
