import { Effect, pipe } from 'effect'
import type { NarrationStyle } from './store'
import { NetworkError, ApiError } from './errors'

function fetchJson(url: string, options: RequestInit) {
  return Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: () => fetch(url, options),
      catch: (e) => new NetworkError(e instanceof Error ? e.message : 'Network error')
    })

    if (!res.ok) {
      const text = yield* Effect.tryPromise({
        try: () => res.text(),
        catch: () => new ApiError('Failed to read error response', res.status)
      })
      return yield* Effect.fail(new ApiError(text || 'Request failed', res.status))
    }

    const data = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: () => new ApiError('Failed to parse response JSON')
    })

    return data
  })
}

export function generateSyllabusEffect(topic: string, layer: number, rootTopic: string, parentPath: string[], narrationStyle: NarrationStyle) {
  return fetchJson('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, layer, rootTopic, parentPath, narrationStyle }),
  })
}

export async function generateSyllabus(topic: string, layer: number, rootTopic: string, parentPath: string[], narrationStyle: NarrationStyle): Promise<any> {
  return pipe(
    generateSyllabusEffect(topic, layer, rootTopic, parentPath, narrationStyle),
    Effect.catchAll((error) => Effect.fail(new Error(error.message))),
    Effect.runPromise
  )
}

export function generateImageEffect(topic: string, context: string) {
  return pipe(
    fetchJson('/.netlify/functions/gemini-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, context }),
    }),
    Effect.map((data: any) => data.image as string)
  )
}

export async function generateImage(topic: string, context: string): Promise<string> {
  return pipe(
    generateImageEffect(topic, context),
    Effect.catchAll((error) => Effect.fail(new Error(error.message))),
    Effect.runPromise
  )
}
