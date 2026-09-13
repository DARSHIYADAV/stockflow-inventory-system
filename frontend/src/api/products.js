import client from './client'

export async function listProducts() {
  const { data } = await client.get('/products')
  return data
}

export async function listAssignableProducts() {
  const { data } = await client.get('/products/assignable')
  return data
}

export async function createProduct(payload) {
  const { data } = await client.post('/products', payload)
  return data
}

export async function updateProduct(id, payload) {
  const { data } = await client.put(`/products/${id}`, payload)
  return data
}

export async function deleteProduct(id) {
  await client.delete(`/products/${id}`)
}

export async function createStockTransaction(productId, payload) {
  const { data } = await client.post(`/stock/${productId}/transaction`, payload)
  return data
}

export async function getStockHistory(productId) {
  const { data } = await client.get(`/stock/${productId}/history`)
  return data
}
