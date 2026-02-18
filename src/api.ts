export async function generateSyllabus(topic: string, layer: number, rootTopic: string, parentPath: string[]): Promise<any> {
  const res = await fetch('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, layer, rootTopic, parentPath }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to generate content')
  }
  return res.json()
}
