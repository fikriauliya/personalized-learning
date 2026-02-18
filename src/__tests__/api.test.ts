import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSyllabus } from '../api'

describe('generateSyllabus', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed JSON on success', async () => {
    const mockData = { title: 'Test', content: 'Hello', subtopics: ['A', 'B'] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }))

    const result = await generateSyllabus('test', 1, 'test', [], 'casual')
    expect(result).toEqual(mockData)
    expect(fetch).toHaveBeenCalledWith('/.netlify/functions/gemini', expect.objectContaining({ method: 'POST' }))
  })

  it('throws on API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: () => Promise.resolve('Gemini API error'),
    }))

    await expect(generateSyllabus('test', 1, 'test', [], 'casual')).rejects.toThrow('Gemini API error')
  })

  it('throws on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    await expect(generateSyllabus('test', 1, 'test', [], 'casual')).rejects.toThrow('Failed to fetch')
  })
})
