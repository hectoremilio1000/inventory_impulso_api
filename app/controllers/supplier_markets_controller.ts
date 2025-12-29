import type { HttpContext } from '@adonisjs/core/http'
import SupplierMarket from '#models/supplier_market'
import { getRestaurantId } from '#utils/restaurant'

export default class SupplierMarketsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()

    const query = SupplierMarket.query().where('restaurantId', restaurantId).orderBy('name', 'asc')
    if (q) query.where((b) => b.whereILike('code', `%${q}%`).orWhereILike('name', `%${q}%`))
    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['code', 'name', 'description', 'isActive'])
    const row = await SupplierMarket.create({ ...payload, restaurantId })
    return response.created(row)
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    row.merge(request.only(['code', 'name', 'description', 'isActive']))
    await row.save()
    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
