import type { HttpContext } from '@adonisjs/core/http'
import WarehouseLocation from '#models/warehouse_location'
import InventoryWarehouse from '#models/inventory_warehouse'
import { getRestaurantId } from '#utils/restaurant'

export default class WarehouseLocationsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const warehouseId = Number(request.input('warehouseId') || 0) || null

    const query = WarehouseLocation.query().where('restaurantId', restaurantId)
    if (warehouseId) {
      query.where('warehouseId', warehouseId)
    }
    query.orderBy('name', 'asc')

    return query
  }

  public async store({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['warehouseId', 'name', 'parentId', 'isActive'])

    // valida almacén pertenece al restaurante
    await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(payload.warehouseId))
      .firstOrFail()

    if (payload.parentId) {
      await WarehouseLocation.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.parentId))
        .firstOrFail()
    }

    const row = await WarehouseLocation.create({
      restaurantId,
      warehouseId: payload.warehouseId,
      name: payload.name,
      parentId: payload.parentId ?? null,
      isActive: payload.isActive !== false,
    })

    return row
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['warehouseId', 'name', 'parentId', 'isActive'])

    const row = await WarehouseLocation.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(params.id))
      .firstOrFail()

    if (payload.warehouseId) {
      await InventoryWarehouse.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.warehouseId))
        .firstOrFail()
    }

    if (payload.parentId) {
      await WarehouseLocation.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.parentId))
        .firstOrFail()
    }

    row.merge({
      warehouseId: payload.warehouseId ?? row.warehouseId,
      name: payload.name ?? row.name,
      parentId: payload.parentId ?? null,
      isActive: payload.isActive ?? row.isActive,
    })
    await row.save()
    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await WarehouseLocation.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(params.id))
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
