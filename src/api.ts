import type { NarrationStyle } from './store'

export async function generateSyllabus(topic: string, layer: number, rootTopic: string, parentPath: string[], narrationStyle: NarrationStyle): Promise<any> {
  const res = await fetch('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, layer, rootTopic, parentPath, narrationStyle }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to generate content')
  }
  return res.json()
}

export async function generateImage(topic: string, context: string): Promise<string> {
  const res = await fetch('/.netlify/functions/gemini-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, context }),
  })
  if (!res.ok) {
    throw new Error('Failed to generate image')
  }
  const data = await res.json()
  return data.image // base64 string
}
