import { Effect } from 'effect'
import { JsonParseError } from './errors'

export const STYLE_INSTRUCTIONS: Record<string, string> = {
  academic: 'Use a formal, academic tone. Write like a university textbook — precise, structured, and authoritative.',
  casual: 'Use a casual, conversational tone. Be friendly and approachable, like explaining to a friend.',
  eli5: 'Explain like I\'m 5 years old. Use very simple language, everyday analogies, and short sentences. Make it fun and easy to understand.',
  storytelling: 'Use a narrative, storytelling style. Weave in analogies, metaphors, and real-world stories. Make it engaging and memorable.',
}

export function buildPrompt(topic: string, layer: number, context: string, styleInstruction: string): string {
  const imageInstruction = `
- Where a visual would help understanding, insert an image marker: [[image:brief description of what to illustrate]]
- Place image markers on their own line, right after the paragraph that needs the visual
- Use 1-2 image markers per response, only where truly helpful (diagrams, processes, concepts)`

  if (layer === 4) {
    return `You are an expert educator. ${styleInstruction}

Write a comprehensive, insightful explanation of "${topic}" in the context of learning ${context}.

Requirements:
- Write 4-6 paragraphs of rich educational content
- Include concrete examples, key insights, and practical understanding
- Use markdown formatting (headers, bold, code blocks where relevant)
- Make the content genuinely useful — not a surface-level summary
${imageInstruction}

Return ONLY a JSON object: {"title": "...", "content": "..."} where content is markdown. No wrapping code blocks.`
  }

  const subtopicCount = layer === 1 ? '5-8' : '4-6'
  return `You are an expert educator. ${styleInstruction}

Write rich, insightful educational content about "${topic}"${layer > 1 ? ` in the context of learning ${context}` : ''}.

Requirements:
- Write 3-5 paragraphs of genuinely useful educational content — multiple paragraphs of real insight, not just a summary
- Within the prose, naturally introduce ${subtopicCount} subtopics that a learner should explore deeper
- Mark each subtopic using this exact syntax: [[subtopic:Subtopic Name]] — these will become clickable links
- The subtopics should flow naturally within sentences, not be listed separately
- Use markdown formatting for emphasis, headers where appropriate
- Make the content comprehensive enough to be valuable on its own
${imageInstruction}

Example of inline subtopic usage:
"Understanding how [[subtopic:Neural Networks]] process information requires grasping the concept of [[subtopic:Backpropagation]]..."

Return ONLY a JSON object: {"title": "...", "content": "...", "subtopics": ["Subtopic Name 1", "Subtopic Name 2", ...]}
The subtopics array should list all the subtopic names used in [[subtopic:...]] markers.
No wrapping markdown code blocks, just raw JSON.`
}

export function escapeControlChars(cleaned: string): string {
  let escaped = ''
  let inString = false
  let prevBackslash = false
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (inString) {
      if (prevBackslash) {
        escaped += ch
        prevBackslash = false
      } else if (ch === '\\') {
        escaped += ch
        prevBackslash = true
      } else if (ch === '"') {
        escaped += ch
        inString = false
      } else if (ch === '\n') {
        escaped += '\\n'
      } else if (ch === '\r') {
        escaped += '\\r'
      } else if (ch === '\t') {
        escaped += '\\t'
      } else if (ch.charCodeAt(0) < 0x20) {
        // skip other control chars
      } else {
        escaped += ch
      }
    } else {
      if (ch === '"') {
        inString = true
      }
      escaped += ch
    }
  }
  return escaped
}

export function parseGeminiJson(text: string): Effect.Effect<unknown, JsonParseError> {
  return Effect.gen(function* () {
    // Attempt 1: direct parse
    try {
      return JSON.parse(text)
    } catch {
      // continue
    }

    // Attempt 2: strip code fences
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      // continue
    }

    // Attempt 3: escape control chars
    const escaped = escapeControlChars(cleaned)
    try {
      return JSON.parse(escaped)
    } catch {
      return yield* Effect.fail(new JsonParseError('Failed to parse AI response', text.slice(0, 500)))
    }
  })
}
