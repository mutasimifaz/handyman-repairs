export async function uploadImages(files, onProgress = () => {}) {
  const key = import.meta.env.VITE_IMGBB_API_KEY
  if (!key) throw new Error('Add VITE_IMGBB_API_KEY to your .env file first.')
  const list = Array.from(files || [])
  if (!list.length) return []
  const urls = []
  for (let i = 0; i < list.length; i++) {
    const file = list[i]
    if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`)
    if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} exceeds 8 MB.`)
    const form = new FormData()
    form.append('image', file)
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { method: 'POST', body: form })
    const result = await response.json()
    if (!response.ok || !result.success) throw new Error(result.error?.message || `Could not upload ${file.name}`)
    urls.push(result.data.display_url || result.data.url)
    onProgress(Math.round(((i + 1) / list.length) * 100))
  }
  return urls
}