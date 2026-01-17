import type { HttpContext } from '@adonisjs/core/http'
import SupplierMarket from '#models/supplier_market'
import SupplierMarketSupplier from '#models/supplier_market_supplier'
import Supplier from '#models/supplier'
import { getRestaurantId } from '#utils/restaurant'

export default class SupplierMarketSuppliersController {
  // GET /api/supplier-markets/:marketId/suppliers?restaurantId=1
  public async index({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    await SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .where('id', params.marketId)
      .firstOrFail()

    return SupplierMarketSupplier.query()
      .where('supplierMarketId', params.marketId)
      .preload('supplier')
      .orderBy('id', 'desc')
  }

  // POST /api/supplier-markets/:marketId/suppliers
  // body: { supplierId }
  public async store({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    await SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .where('id', params.marketId)
      .firstOrFail()

    const supplierId = Number(request.input('supplierId'))
    if (!supplierId) return response.badRequest({ message: 'supplierId requerido' })

    // validar supplier del restaurante
    await Supplier.query().where('restaurantId', restaurantId).where('id', supplierId).firstOrFail()

    const marketId = Number(params.marketId)
    await SupplierMarketSupplier.query()
      .where('supplierId', supplierId)
      .whereNot('supplierMarketId', marketId)
      .delete()

    const row = await SupplierMarketSupplier.firstOrCreate({
      supplierMarketId: marketId,
      supplierId,
    })

    await row.load('supplier')
    return response.created(row)
  }

  // DELETE /api/supplier-markets/:marketId/suppliers/:id
  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    await SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .where('id', params.marketId)
      .firstOrFail()

    const row = await SupplierMarketSupplier.query()
      .where('supplierMarketId', params.marketId)
      .where('id', params.id)
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
