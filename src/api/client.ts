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

export async function assistantApiFetchBlob(path: string): Promise<Blob> {
  const response = await fetch(`${ASSISTANT_BASE_URL}${path}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.blob()
}

export async function* assistantApiStream(
  path: string,
  body: unknown,
): AsyncGenerator<{ event: string; data: string }> {
  const response = await fetch(`${ASSISTANT_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    let eventName = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventName = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (eventName) yield { event: eventName, data }
        eventName = ''
      }
    }
  }
}
