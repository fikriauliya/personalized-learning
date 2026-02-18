export function estimateReadTime(content: string): string {
  // Strip markdown/HTML and count words
  const text = content.replace(/\[\[.*?\]\]/g, '').replace(/<[^>]*>/g, '').replace(/[#*`_\-|]/g, '')
  const words = text.split(/\s+/).filter(w => w.length > 0).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `~${minutes} min read`
}
