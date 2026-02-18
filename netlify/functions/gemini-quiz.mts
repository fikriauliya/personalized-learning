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
    const { topic, content } = body

    const prompt = `You are an expert educator creating a quiz. Based on the following content about "${topic}", generate exactly 3 multiple-choice questions.

Content:
${content}

Return a JSON object with this exact format:
{"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..."}]}

Rules:
- Each question must have exactly 4 options
- correctIndex is 0-based (0-3)
- Questions should test understanding, not just memorization
- Explanations should be brief (1-2 sentences)
- Make questions progressively harder`

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
