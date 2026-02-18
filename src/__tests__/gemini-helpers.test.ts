import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { buildPrompt, parseGeminiJson, STYLE_INSTRUCTIONS } from '../gemini-helpers'

describe('buildPrompt', () => {
  it('builds layer 4 prompt (deepest, no subtopics)', () => {
    const prompt = buildPrompt('Neural Networks', 4, 'ML > Deep Learning', STYLE_INSTRUCTIONS.casual)
    expect(prompt).toContain('Neural Networks')
    expect(prompt).toContain('ML > Deep Learning')
    expect(prompt).toContain('"content"')
    expect(prompt).not.toContain('subtopics')
  })

  it('builds layer 1 prompt with 5-8 subtopics', () => {
    const prompt = buildPrompt('Machine Learning', 1, 'Machine Learning', STYLE_INSTRUCTIONS.academic)
    expect(prompt).toContain('5-8')
    expect(prompt).toContain('subtopics')
    expect(prompt).toContain('academic')
  })

  it('builds layer 2 prompt with 4-6 subtopics and context', () => {
    const prompt = buildPrompt('Deep Learning', 2, 'ML', STYLE_INSTRUCTIONS.eli5)
    expect(prompt).toContain('4-6')
    expect(prompt).toContain('in the context of learning ML')
  })
})

describe('parseGeminiJson', () => {
  it('parses clean JSON', async () => {
    const result = await Effect.runPromise(parseGeminiJson('{"title":"Test","content":"Hello"}'))
    expect(result).toEqual({ title: 'Test', content: 'Hello' })
  })

  it('parses JSON with code fences', async () => {
    const text = '```json\n{"title":"Test"}\n```'
    const result = await Effect.runPromise(parseGeminiJson(text))
    expect(result).toEqual({ title: 'Test' })
  })

  it('parses JSON with control characters', async () => {
    const text = '{"title":"Test","content":"line1\nline2"}'
    const result = await Effect.runPromise(parseGeminiJson(text))
    expect(result).toEqual({ title: 'Test', content: 'line1\nline2' })
  })

  it('fails on completely invalid text', async () => {
    const result = await Effect.runPromiseExit(parseGeminiJson('not json at all'))
    expect(result._tag).toBe('Failure')
  })
})
