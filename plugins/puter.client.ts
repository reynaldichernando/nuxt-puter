import type { Puter } from '@heyputer/puter.js'

export default defineNuxtPlugin(async () => {
  const g = globalThis as any
  const savedProcess = g.process
  g.process = undefined
  let puter: Puter
  try {
    puter = (await import('@heyputer/puter.js')).default
  } finally {
    g.process = savedProcess
  }

  return {
    provide: { puter },
  }
})

declare module '#app' {
  interface NuxtApp {
    $puter: Puter
  }
}
