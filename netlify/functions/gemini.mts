import type { Context } from "@netlify/functions"
import { Effect, pipe } from 'effect'
import { ConfigError, GeminiApiError, JsonParseError } from '../../src/errors'
import { STYLE_INSTRUCTIONS, buildPrompt, parseGeminiJson } from '../../src/gemini-helpers'

const getApiKey = Effect.gen(function* () {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return yield* Effect.fail(new ConfigError('GEMINI_API_KEY not configured'))
  }
  return apiKey
})

function callGemini(apiKey: string, prompt: string) {
  return Effect.tryPromise({
    try: async () => {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          }
        })
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new GeminiApiError(`Gemini API error: ${errText}`, res.status)
      }
      const data = await res.json()
      return (data.candidates?.[0]?.content?.parts?.[0]?.text || '') as string
    },
    catch: (e) => {
      if (e instanceof GeminiApiError) return e
      return new GeminiApiError(e instanceof Error ? e.message : 'Unknown error')
    }
  })
}

function handleRequest(req: Request) {
  return Effect.gen(function* () {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const apiKey = yield* getApiKey

    const body = yield* Effect.tryPromise({
      try: () => req.json(),
      catch: () => new GeminiApiError('Invalid request body')
    })

    const { topic, layer, rootTopic, parentPath, narrationStyle = 'casual' } = body
    const styleInstruction = STYLE_INSTRUCTIONS[narrationStyle] || STYLE_INSTRUCTIONS.casual
    const context = parentPath.length > 0 ? parentPath.join(' > ') : rootTopic
    const prompt = buildPrompt(topic, layer, context, styleInstruction)

    const text = yield* callGemini(apiKey, prompt)
    const parsed = yield* parseGeminiJson(text)

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' }
    })
  })
}

export default async (req: Request, _context: Context) => {
  return pipe(
    handleRequest(req),
    Effect.catchAll((error) => {
      if (error instanceof ConfigError) {
        return Effect.succeed(new Response(error.message, { status: 500 }))
      }
      if (error instanceof GeminiApiError) {
        return Effect.succeed(new Response(error.message, { status: 502 }))
      }
      if (error instanceof JsonParseError) {
        return Effect.succeed(new Response(
          JSON.stringify({ error: 'Failed to parse AI response. Please try again.' }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        ))
      }
      return Effect.succeed(new Response(`Error: ${String(error)}`, { status: 500 }))
    }),
    Effect.runPromise
  )
}
