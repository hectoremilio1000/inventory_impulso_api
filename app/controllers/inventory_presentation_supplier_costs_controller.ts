import type { HttpContext } from '@adonisjs/core/http'
import InventoryPresentation from '#models/inventory_presentation'
import InventoryPresentationSupplierCost from '#models/inventory_presentation_supplier_cost'
import Supplier from '#models/supplier'
import { getRestaurantId } from '#utils/restaurant'

export default class InventoryPresentationSupplierCostsController {
  // GET /api/inventory/presentations/:id/supplier-costs
  public async index({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    // 🔒 scoping: presentation pertenece al restaurant vía inventory_items
    await InventoryPresentation.query()
      .join('inventory_items', 'inventory_items.id', 'inventory_presentations.inventory_item_id')
      .where('inventory_presentations.id', Number(params.id))
      .where('inventory_items.restaurant_id', restaurantId)
      .select('inventory_presentations.*')
      .firstOrFail()

    return InventoryPresentationSupplierCost.query()
      .where('restaurantId', restaurantId)
      .where('presentationId', Number(params.id))
      .preload('supplier')
      .orderBy('id', 'desc')
  }

  // PUT /api/inventory/presentations/:id/supplier-costs/:supplierId
  public async upsert({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const presentationId = Number(params.id)
    const supplierId = Number(params.supplierId)

    // 🔒 scoping: presentation pertenece al restaurant
    await InventoryPresentation.query()
      .join('inventory_items', 'inventory_items.id', 'inventory_presentations.inventory_item_id')
      .where('inventory_presentations.id', presentationId)
      .where('inventory_items.restaurant_id', restaurantId)
      .select('inventory_presentations.*')
      .firstOrFail()

    // 🔒 scoping: supplier pertenece al restaurant
    await Supplier.query().where('restaurantId', restaurantId).where('id', supplierId).firstOrFail()

    const payload = request.only(['lastCost'])

    let row = await InventoryPresentationSupplierCost.query()
      .where('restaurantId', restaurantId)
      .where('presentationId', presentationId)
      .where('supplierId', supplierId)
      .first()

    if (!row) {
      row = await InventoryPresentationSupplierCost.create({
        restaurantId,
        presentationId,
        supplierId,
        lastCost: payload.lastCost ?? null,
        // lastPurchaseAt se llena automático cuando “recibes” compras (después lo conectamos)
      })
    } else {
      row.merge({
        lastCost: payload.lastCost ?? null,
      })
      await row.save()
    }

    await row.load('supplier')
    return row
  }

  // DELETE /api/inventory/presentations/:id/supplier-costs/:supplierId
  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const presentationId = Number(params.id)
    const supplierId = Number(params.supplierId)

    const row = await InventoryPresentationSupplierCost.query()
      .where('restaurantId', restaurantId)
      .where('presentationId', presentationId)
      .where('supplierId', supplierId)
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
