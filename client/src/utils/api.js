// API 工具
const API_BASE = ''

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export const apiGet = async (url) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/admin/login'
    throw new Error('未登录')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || '请求失败')
  }
  return res.json()
}

export const apiPost = async (url, data) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/admin/login'
    throw new Error('未登录')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || '请求失败')
  }
  return res.json()
}

export const apiPut = async (url, data) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/admin/login'
    throw new Error('未登录')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || '请求失败')
  }
  return res.json()
}

export const apiDelete = async (url) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/admin/login'
    throw new Error('未登录')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || '请求失败')
  }
  return res.json()
}

export const apiPostNoAuth = async (url, data) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || '请求失败')
  }
  return res.json()
}

export const apiDownload = async (url, filename) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/admin/login'
    throw new Error('未登录')
  }
  if (!res.ok) {
    throw new Error('下载失败')
  }
  const blob = await res.blob()
  const url2 = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url2
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url2)
}
