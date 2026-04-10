const API_BASE = '/api'

export async function apiGet(url) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export async function apiPost(url, body) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export async function apiPut(url, body) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export async function apiDelete(url) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export async function apiDownload(url, filename) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  const blob = await res.blob()
  const url2 = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url2
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url2)
}
