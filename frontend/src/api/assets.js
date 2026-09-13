import client from './client'

export async function listAssets(statusFilter) {
  const params = statusFilter ? { status_filter: statusFilter } : {}
  const { data } = await client.get('/assets', { params })
  return data
}

export async function listMyAssets() {
  const { data } = await client.get('/assets/my')
  return data
}

export async function createAsset(payload) {
  const { data } = await client.post('/assets', payload)
  return data
}

export async function bulkCreateAssets(payload) {
  const { data } = await client.post('/assets/bulk', payload)
  return data
}

export async function getAssetHistory(assetId) {
  const { data } = await client.get(`/assets/${assetId}/history`)
  return data
}

export async function assignAsset(assetId, payload) {
  const { data } = await client.post(`/assets/${assetId}/assign`, payload)
  return data
}

export async function returnAsset(assetId, payload) {
  const { data } = await client.post(`/assets/${assetId}/return`, payload)
  return data
}
