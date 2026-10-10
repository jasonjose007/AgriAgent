const BASE = '/api'

function authHeaders() {
  const token = localStorage.getItem('agriagent_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiPost(path, body, isForm = false) {
  const opts = { method: 'POST', headers: { ...authHeaders() } }
  if (isForm) {
    opts.body = body
  } else {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`)
  return data
}

export async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`)
  return data
}

export async function apiPut(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`)
  return data
}

export async function registerUser(formData) {
  return apiPost('/auth/register', formData)
}

export async function loginUser(phone, password) {
  return apiPost('/auth/login', { phone_number: phone, password })
}

export async function fetchProfile() {
  return apiGet('/auth/me')
}

export async function sendChatMessage(message, imageFile = null) {
  const formData = new FormData()
  formData.append('message', message)
  if (imageFile) formData.append('image', imageFile)
  return apiPost('/chat', formData, true)
}

export async function sendAgentChat(message, imageFile = null) {
  const formData = new FormData()
  formData.append('message', message)
  if (imageFile) formData.append('image', imageFile)
  return apiPost('/agent/chat', formData, true)
}
