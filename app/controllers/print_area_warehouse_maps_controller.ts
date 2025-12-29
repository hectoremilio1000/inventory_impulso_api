import type { HttpContext } from '@adonisjs/core/http'
import PrintAreaWarehouseMap from '#models/print_area_warehouse_map'
import InventoryWarehouse from '#models/inventory_warehouse'
import { getRestaurantId } from '#utils/restaurant'

export default class PrintAreaWarehouseMapsController {
  // GET /api/inventory/print-area-warehouse-maps
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    return PrintAreaWarehouseMap.query()
      .where('restaurantId', restaurantId)
      .preload('warehouse')
      .orderBy('printAreaId', 'asc')
  }

  // POST /api/inventory/print-area-warehouse-maps
  // body: { printAreaId, warehouseId }
  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const printAreaId = Number(request.input('printAreaId') || 0)
    const warehouseId = Number(request.input('warehouseId') || 0)

    if (!printAreaId || !warehouseId) {
      return response.badRequest({ error: 'printAreaId y warehouseId requeridos' })
    }

    // valida warehouse del restaurante
    await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', warehouseId)
      .firstOrFail()

    // upsert por unique (restaurant_id, print_area_id)
    const row = await PrintAreaWarehouseMap.updateOrCreate(
      { restaurantId, printAreaId },
      { restaurantId, printAreaId, warehouseId }
    )

    await row.load('warehouse')
    return response.created(row)
  }

  // PUT /api/inventory/print-area-warehouse-maps/:id
  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await PrintAreaWarehouseMap.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(params.id))
      .firstOrFail()

    const warehouseId = Number(request.input('warehouseId') || 0)
    if (warehouseId) {
      await InventoryWarehouse.query()
        .where('restaurantId', restaurantId)
        .where('id', warehouseId)
        .firstOrFail()
      row.warehouseId = warehouseId
    }

    await row.save()
    await row.load('warehouse')
    return row
  }

  // DELETE /api/inventory/print-area-warehouse-maps/:id
  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await PrintAreaWarehouseMap.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(params.id))
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
