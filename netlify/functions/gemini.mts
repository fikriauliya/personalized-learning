import type { Context } from "@netlify/functions"

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response('GEMINI_API_KEY not configured', { status: 500 })
  }

  try {
    const { topic, layer, rootTopic, parentPath } = await req.json()

    let prompt: string
    if (layer === 1) {
      prompt = `Generate a learning syllabus for "${topic}". List 5-8 key foundational concepts a student needs to understand. Return ONLY a JSON array of objects with "title" and "description" fields. No markdown, no explanation, just the JSON array.`
    } else if (layer === 4) {
      const context = parentPath.join(' > ')
      prompt = `Explain "${topic}" in the context of ${context}. Provide a comprehensive explanation with examples. Return ONLY a JSON object with "title" and "content" fields where content is markdown formatted text. No wrapping markdown code blocks, just the raw JSON.`
    } else {
      prompt = `Break down the concept "${topic}" within the context of learning "${rootTopic}". List 5-8 subtopics a student should understand. Return ONLY a JSON array of objects with "title" and "description" fields. No markdown, no explanation, just the JSON array.`
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      return new Response(`Gemini API error: ${errText}`, { status: 502 })
    }

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Extract JSON from response (strip markdown code blocks if present)
    const jsonMatch = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(jsonMatch)

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}
