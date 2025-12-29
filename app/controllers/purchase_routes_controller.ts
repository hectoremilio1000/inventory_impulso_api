import type { HttpContext } from '@adonisjs/core/http'
import PurchaseRoute from '#models/purchase_route'
import SupplierMarket from '#models/supplier_market'
import Supplier from '#models/supplier'
import { getRestaurantId } from '#utils/restaurant'

export default class PurchaseRoutesController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const weekday = request.input('weekday')
    const supplierId = request.input('supplierId')
    const supplierMarketId = request.input('supplierMarketId')

    const query = PurchaseRoute.query()
      .where('restaurantId', restaurantId)
      .preload('supplier')
      .preload('market')
      .orderBy('weekday', 'asc')
      .orderBy('sequence', 'asc')

    if (weekday !== undefined) query.where('weekday', Number(weekday))
    if (supplierId) query.where('supplierId', Number(supplierId))
    if (supplierMarketId) query.where('supplierMarketId', Number(supplierMarketId))

    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only([
      'routeCode',
      'supplierMarketId',
      'supplierId',
      'weekday',
      'startTime',
      'endTime',
      'sequence',
      'notes',
    ])

    if (payload.supplierMarketId) {
      await SupplierMarket.query()
        .where('restaurantId', restaurantId)
        .where('id', payload.supplierMarketId)
        .firstOrFail()
    }

    if (payload.supplierId) {
      await Supplier.query()
        .where('restaurantId', restaurantId)
        .where('id', payload.supplierId)
        .firstOrFail()
    }

    const row = await PurchaseRoute.create({ ...payload, restaurantId })
    return response.created(row)
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const row = await PurchaseRoute.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    const payload = request.only([
      'routeCode',
      'supplierMarketId',
      'supplierId',
      'weekday',
      'startTime',
      'endTime',
      'sequence',
      'notes',
    ])

    row.merge(payload)
    await row.save()
    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const row = await PurchaseRoute.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
