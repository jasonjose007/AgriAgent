const API_BASE = '/api'

export async function sendChatMessage(message, imageFile = null) {
  const formData = new FormData()
  formData.append('message', message)
  if (imageFile) {
    formData.append('image', imageFile)
  }

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `API returned ${res.status}`)
  }

  return res.json()
}
