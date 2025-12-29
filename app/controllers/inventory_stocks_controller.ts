import type { HttpContext } from '@adonisjs/core/http'
import InventoryStock from '#models/inventory_stock'
import { getRestaurantId } from '#utils/restaurant'

export default class InventoryStocksController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const warehouseId = request.input('warehouseId')
    const itemId = request.input('inventoryItemId')

    const q = InventoryStock.query()
      .where('restaurantId', restaurantId)
      .preload('warehouse')
      .preload('item', (iq) => iq.preload('unit').preload('group'))
      .orderBy('id', 'desc')

    if (warehouseId) q.where('warehouseId', Number(warehouseId))
    if (itemId) q.where('inventoryItemId', Number(itemId))

    return q
  }
}
