const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const ASSISTANT_BASE_URL = import.meta.env.VITE_ASSISTANT_API_BASE_URL ?? 'http://localhost:8080'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const data = (await response.json()) as T

  if (!response.ok) {
    throw data
  }

  return data
}

export async function assistantApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ASSISTANT_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const data = (await response.json()) as T

  if (!response.ok) {
    throw data
  }

  return data
}
