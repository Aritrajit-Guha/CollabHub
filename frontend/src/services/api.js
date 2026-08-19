const configuredApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_BASE = configuredApiBase.replace(/\/$/, '')

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export async function readJsonResponse(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || payload.reply || `Request failed with HTTP ${response.status}`)
  }
  return payload
}
