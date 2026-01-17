import type { HttpContext } from '@adonisjs/core/http'
import { getRestaurantId } from '#utils/restaurant'

export default class PosProductsController {
  public async index({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()
    const limitRaw = Number(request.input('limit', 20)) || 20
    const limit = Math.min(Math.max(limitRaw, 1), 50)

    const base = String(process.env.ORDER_API_BASE_URL ?? '').trim()
    if (!base) {
      return response.badRequest({ error: 'missing_ORDER_API_BASE_URL' })
    }

    const url =
      `${base.replace(/\/$/, '')}/api/public/products` +
      `?restaurantId=${encodeURIComponent(String(restaurantId))}` +
      `&q=${encodeURIComponent(q)}` +
      `&limit=${encodeURIComponent(String(limit))}`

    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      return response.badRequest({ error: 'pos_products_failed', status: res.status, details: text })
    }

    return res.json()
  }
}
