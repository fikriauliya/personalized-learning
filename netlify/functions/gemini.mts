import type { Context } from "@netlify/functions"

const STYLE_INSTRUCTIONS: Record<string, string> = {
  academic: 'Use a formal, academic tone. Write like a university textbook — precise, structured, and authoritative.',
  casual: 'Use a casual, conversational tone. Be friendly and approachable, like explaining to a friend.',
  eli5: 'Explain like I\'m 5 years old. Use very simple language, everyday analogies, and short sentences. Make it fun and easy to understand.',
  storytelling: 'Use a narrative, storytelling style. Weave in analogies, metaphors, and real-world stories. Make it engaging and memorable.',
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response('GEMINI_API_KEY not configured', { status: 500 })
  }

  try {
    const { topic, layer, rootTopic, parentPath, narrationStyle = 'casual' } = await req.json()
    const styleInstruction = STYLE_INSTRUCTIONS[narrationStyle] || STYLE_INSTRUCTIONS.casual
    const context = parentPath.length > 0 ? parentPath.join(' > ') : rootTopic

    let prompt: string
    if (layer === 4) {
      // Deepest layer: detailed content, no subtopics
      prompt = `You are an expert educator. ${styleInstruction}

Write a comprehensive, insightful explanation of "${topic}" in the context of learning ${context}.

Requirements:
- Write 4-6 paragraphs of rich educational content
- Include concrete examples, key insights, and practical understanding
- Use markdown formatting (headers, bold, code blocks where relevant)
- Make the content genuinely useful — not a surface-level summary

Return ONLY a JSON object: {"title": "...", "content": "..."} where content is markdown. No wrapping code blocks.`
    } else {
      // Layers 1-3: rich content WITH inline subtopic links
      const subtopicCount = layer === 1 ? '5-8' : '4-6'
      prompt = `You are an expert educator. ${styleInstruction}

Write rich, insightful educational content about "${topic}"${layer > 1 ? ` in the context of learning ${context}` : ''}.

Requirements:
- Write 3-5 paragraphs of genuinely useful educational content — multiple paragraphs of real insight, not just a summary
- Within the prose, naturally introduce ${subtopicCount} subtopics that a learner should explore deeper
- Mark each subtopic using this exact syntax: [[subtopic:Subtopic Name]] — these will become clickable links
- The subtopics should flow naturally within sentences, not be listed separately
- Use markdown formatting for emphasis, headers where appropriate
- Make the content comprehensive enough to be valuable on its own

Example of inline subtopic usage:
"Understanding how [[subtopic:Neural Networks]] process information requires grasping the concept of [[subtopic:Backpropagation]]..."

Return ONLY a JSON object: {"title": "...", "content": "...", "subtopics": ["Subtopic Name 1", "Subtopic Name 2", ...]}
The subtopics array should list all the subtopic names used in [[subtopic:...]] markers.
No wrapping markdown code blocks, just raw JSON.`
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
    
    const jsonMatch = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(jsonMatch)

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}
