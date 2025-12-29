import type { HttpContext } from '@adonisjs/core/http'
import InventoryGroup from '#models/inventory_group'
import { getRestaurantId } from '#utils/restaurant'

export default class InventoryGroupsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()

    const query = InventoryGroup.query().where('restaurantId', restaurantId).orderBy('name', 'asc')
    if (q) {
      query.whereILike('code', `%${q}%`).orWhereILike('name', `%${q}%`)
    }

    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['code', 'name', 'description', 'isActive'])
    const row = await InventoryGroup.create({ ...payload, restaurantId })
    return response.created(row)
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await InventoryGroup.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    row.merge(request.only(['code', 'name', 'description', 'isActive']))
    await row.save()
    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await InventoryGroup.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
