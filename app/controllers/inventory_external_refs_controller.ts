import type { HttpContext } from '@adonisjs/core/http'
import InventoryExternalRef from '#models/inventory_external_ref'
import { getRestaurantId } from '#utils/restaurant'

export default class InventoryExternalRefsController {
  // GET /api/inventory/external-refs?source=pos-order&refType=order_item&q=
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const source = request.input('source')
    const refType = request.input('refType')
    const q = String(request.input('q') ?? '').trim()

    const query = InventoryExternalRef.query()
      .where('restaurantId', restaurantId)
      .orderBy('appliedAt', 'desc')
      .limit(500)

    if (source) query.where('source', String(source))
    if (refType) query.where('refType', String(refType))
    if (q) query.whereILike('refId', `%${q}%`)

    return query
  }

  // DELETE /api/inventory/external-refs/:id  (solo si quieres “des-aplicar” manualmente)
  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await InventoryExternalRef.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(params.id))
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
