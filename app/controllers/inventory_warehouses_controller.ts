import type { HttpContext } from '@adonisjs/core/http'
import InventoryWarehouse from '#models/inventory_warehouse'
import { getRestaurantId } from '#utils/restaurant'

export default class InventoryWarehousesController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    return InventoryWarehouse.query().where('restaurantId', restaurantId).orderBy('name', 'asc')
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['code', 'name', 'description', 'kind', 'isActive'])
    const row = await InventoryWarehouse.create({ ...payload, restaurantId })
    return response.created(row)
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()
    row.merge(request.only(['code', 'name', 'description', 'kind', 'isActive']))
    await row.save()
    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()
    await row.delete()
    return response.noContent()
  }
}
