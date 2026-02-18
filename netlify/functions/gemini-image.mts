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
    const { topic, context } = await req.json()

    const prompt = `Generate a clean, educational illustration or diagram about "${topic}"${context ? ` in the context of ${context}` : ''}. The image should be informative, visually clear, and help a student understand the concept. Use a modern, clean style with labels where appropriate.`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
      })
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      return new Response(`Gemini API error: ${errText}`, { status: 502 })
    }

    const geminiData = await geminiRes.json()
    const parts = geminiData.candidates?.[0]?.content?.parts || []
    
    // Find the image part
    const imagePart = parts.find((p: any) => p.inlineData)
    if (!imagePart) {
      return new Response(JSON.stringify({ error: 'No image generated' }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ 
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}
