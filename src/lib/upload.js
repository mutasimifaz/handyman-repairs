import { auth } from '../firebase'

const WORKER_URL = import.meta.env.VITE_UPLOAD_WORKER_URL || 'https://handyman-payment-worker.studentifaz.workers.dev'

export async function uploadImages(files, onProgress = () => {}) {
  const list = Array.from(files || [])
  if (!list.length) return []

  const user = auth.currentUser
  if (!user) throw new Error('Please sign in again before uploading images.')

  const token = await user.getIdToken()
  const uploaded = new Array(list.length)
  let completed = 0
  let nextIndex = 0
  const concurrency = Math.min(3, list.length)

  async function uploadNext() {
    while (true) {
      const index = nextIndex++
      if (index >= list.length) return
      const file = list[index]

      if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`)
      if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} exceeds 8 MB.`)

      const body = new FormData()
      body.append('image', file, file.name)

      const response = await fetch(`${WORKER_URL}/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.url) {
        throw new Error(result.error || `Could not upload ${file.name}.`)
      }

      uploaded[index] = result.url
      completed += 1
      onProgress(Math.round((completed / list.length) * 100))
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => uploadNext()))
  return [...new Set(uploaded)]
}
