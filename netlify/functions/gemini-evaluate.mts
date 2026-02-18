import type { Context } from "@netlify/functions"
import { Effect, pipe } from 'effect'
import { ConfigError, GeminiApiError } from '../../src/errors'
import { parseGeminiJson } from '../../src/gemini-helpers'

const getApiKey = Effect.gen(function* () {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return yield* Effect.fail(new ConfigError('GEMINI_API_KEY not configured'))
  return apiKey
})

function callGemini(apiKey: string, prompt: string) {
  return Effect.tryPromise({
    try: async () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new GeminiApiError(`Gemini API error: ${errText}`, res.status)
      }
      const data = await res.json()
      return (data.candidates?.[0]?.content?.parts?.[0]?.text || '') as string
    },
    catch: (e) => e instanceof GeminiApiError ? e : new GeminiApiError(e instanceof Error ? e.message : 'Unknown error'),
  })
}

function handleRequest(req: Request) {
  return Effect.gen(function* () {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    const apiKey = yield* getApiKey
    const body = yield* Effect.tryPromise({ try: () => req.json(), catch: () => new GeminiApiError('Invalid request body') })
    const { topic, content, explanation } = body

    const prompt = `You are an expert educator evaluating a student's explanation using the Feynman Technique.

The topic is: "${topic}"
The original content taught:
${content}

The student's explanation in their own words:
"${explanation}"

Evaluate their understanding and return a JSON object:
{"score": 3, "gotRight": ["point 1", "point 2"], "missed": ["point 1"], "correctedExplanation": "A brief corrected version..."}

Rules:
- score is 1-5 (1=poor, 5=excellent)
- gotRight: list key concepts they correctly explained (can be empty)
- missed: list key concepts they missed or got wrong (can be empty)
- correctedExplanation: a brief 2-3 sentence corrected explanation
- Be encouraging but honest`

    const text = yield* callGemini(apiKey, prompt)
    const parsed = yield* parseGeminiJson(text)

    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } })
  })
}

export default async (req: Request, _context: Context) => {
  return pipe(
    handleRequest(req),
    Effect.catchAll((error) => {
      if (error instanceof ConfigError) return Effect.succeed(new Response(error.message, { status: 500 }))
      if (error instanceof GeminiApiError) return Effect.succeed(new Response(error.message, { status: 502 }))
      return Effect.succeed(new Response(`Error: ${String(error)}`, { status: 500 }))
    }),
    Effect.runPromise,
  )
}
