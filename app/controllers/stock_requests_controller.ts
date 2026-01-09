import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import InventoryWarehouse from '#models/inventory_warehouse'
import PurchaseRun from '#models/purchase_run'
import StockRequest from '#models/stock_request'
import StockRequestItem from '#models/stock_request_item'
import { getRestaurantId } from '#utils/restaurant'

export default class StockRequestsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const status = request.input('status')
    const warehouseId = request.input('warehouseId')
    const purchaseRunId = request.input('purchaseRunId')

    const q = StockRequest.query()
      .where('restaurantId', restaurantId)
      .preload('warehouse')
      .preload('purchaseRun')
      .orderBy('id', 'desc')

    if (status) q.where('status', String(status))
    if (warehouseId) q.where('warehouseId', Number(warehouseId))
    if (purchaseRunId) q.where('purchaseRunId', Number(purchaseRunId))

    return q
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const payload = request.only([
      'purchaseRunId',
      'warehouseId',
      'sourceWarehouseId',
      'areaLabel',
      'requestedAt',
      'notes',
      'status',
      'createdBy',
    ])

    if (payload.purchaseRunId) {
      await PurchaseRun.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.purchaseRunId))
        .firstOrFail()
    }

    await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(payload.warehouseId))
      .firstOrFail()

    if (payload.sourceWarehouseId) {
      await InventoryWarehouse.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.sourceWarehouseId))
        .firstOrFail()
    }

    const requestedAt = payload.requestedAt
      ? DateTime.fromISO(String(payload.requestedAt))
      : DateTime.now()

    const row = await StockRequest.create({
      restaurantId,
      purchaseRunId: payload.purchaseRunId ? Number(payload.purchaseRunId) : null,
      warehouseId: Number(payload.warehouseId),
      sourceWarehouseId: payload.sourceWarehouseId ? Number(payload.sourceWarehouseId) : null,
      areaLabel: payload.areaLabel ?? null,
      requestedAt,
      status: (payload.status as any) ?? 'draft',
      notes: payload.notes ?? null,
      createdBy: payload.createdBy ?? null,
    })

    return response.created(row)
  }

  public async show({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    return StockRequest.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .preload('purchaseRun')
      .preload('warehouse')
      .preload('sourceWarehouse')
      .preload('items', (q) => q.preload('presentation'))
      .firstOrFail()
  }

  // POST /stock-requests/:id/items
  public async addItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockRequest = await StockRequest.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (['fulfilled', 'cancelled'].includes(String(stockRequest.status))) {
      return response.badRequest({ message: 'El pedido ya está cerrado' })
    }

    const payload = request.only(['presentationId', 'quantity', 'notes'])
    const item = await StockRequestItem.create({
      stockRequestId: stockRequest.id,
      presentationId: payload.presentationId,
      quantity: payload.quantity,
      notes: payload.notes ?? null,
    })

    await item.load('presentation')
    return response.created(item)
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockRequest = await StockRequest.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    const payload = request.only([
      'warehouseId',
      'sourceWarehouseId',
      'areaLabel',
      'requestedAt',
      'notes',
      'status',
    ])

    if (payload.warehouseId) {
      await InventoryWarehouse.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.warehouseId))
        .firstOrFail()
    }

    if (payload.sourceWarehouseId) {
      await InventoryWarehouse.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.sourceWarehouseId))
        .firstOrFail()
    }

    stockRequest.merge({
      warehouseId: payload.warehouseId ?? stockRequest.warehouseId,
      sourceWarehouseId: payload.sourceWarehouseId ?? stockRequest.sourceWarehouseId,
      areaLabel: payload.areaLabel ?? stockRequest.areaLabel,
      requestedAt: payload.requestedAt
        ? DateTime.fromISO(String(payload.requestedAt))
        : stockRequest.requestedAt,
      notes: payload.notes ?? stockRequest.notes,
      status: payload.status ?? stockRequest.status,
    })

    await stockRequest.save()
    return stockRequest
  }
}
