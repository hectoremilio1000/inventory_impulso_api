import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
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

  // PUT /stock-requests/:id/items/:itemId
  public async updateItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockRequest = await StockRequest.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (['fulfilled', 'cancelled'].includes(String(stockRequest.status))) {
      return response.badRequest({ message: 'El pedido ya está cerrado' })
    }

    const item = await StockRequestItem.query()
      .where('stockRequestId', stockRequest.id)
      .where('id', params.itemId)
      .firstOrFail()

    const payload = request.only(['quantity', 'notes'])

    item.merge({
      quantity: payload.quantity ?? item.quantity,
      notes: payload.notes ?? item.notes,
    })

    await item.save()
    await item.load('presentation')

    return item
  }

  // DELETE /stock-requests/:id/items/:itemId
  public async destroyItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockRequest = await StockRequest.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (['fulfilled', 'cancelled'].includes(String(stockRequest.status))) {
      return response.badRequest({ message: 'El pedido ya está cerrado' })
    }

    const item = await StockRequestItem.query()
      .where('stockRequestId', stockRequest.id)
      .where('id', params.itemId)
      .firstOrFail()

    await item.delete()
    return { ok: true }
  }

  // POST /stock-requests/:id/fulfill
  public async fulfill({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockRequest = await StockRequest.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .preload('items')
      .firstOrFail()

    if (String(stockRequest.status) === 'cancelled') {
      return response.badRequest({ message: 'El pedido está cancelado' })
    }

    const itemsPayload = Array.isArray(request.input('items')) ? request.input('items') : []
    const fulfilledQtyMap = new Map<number, number>()
    for (const row of itemsPayload) {
      const id = Number(row?.id)
      if (!Number.isFinite(id)) continue
      const qty = row?.fulfilledQty
      if (qty === null || qty === undefined || Number.isNaN(Number(qty))) continue
      fulfilledQtyMap.set(id, Number(qty))
    }

    const complete = String(request.input('complete') ?? 'false') === 'true'
    const fulfilledAtRaw = request.input('fulfilledAt')
    const fulfilledAt = fulfilledAtRaw ? DateTime.fromISO(String(fulfilledAtRaw)) : DateTime.now()

    await db.transaction(async (trx) => {
      stockRequest.useTransaction(trx)

      for (const item of stockRequest.items) {
        const nextQty = fulfilledQtyMap.has(item.id)
          ? Number(fulfilledQtyMap.get(item.id))
          : Number(item.quantity)
        item.useTransaction(trx)
        item.fulfilledQty = nextQty
        await item.save()
      }

      stockRequest.status = complete ? 'fulfilled' : 'in_progress'
      stockRequest.fulfilledAt = complete ? fulfilledAt : null
      await stockRequest.save()
    })

    await stockRequest.load('items', (q) => q.preload('presentation'))
    return stockRequest
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

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockRequest = await StockRequest.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (stockRequest.purchaseRunId) {
      const run = await PurchaseRun.query()
        .where('restaurantId', restaurantId)
        .where('id', stockRequest.purchaseRunId)
        .firstOrFail()

      if (run.status !== 'draft') {
        return response.badRequest({ message: 'El viaje no está en borrador' })
      }
    }

    if (String(stockRequest.status) !== 'draft') {
      return response.badRequest({ message: 'El pedido no está en borrador' })
    }

    const itemsCountRow = await StockRequestItem.query()
      .where('stockRequestId', stockRequest.id)
      .count('* as c')
      .first()

    const itemsCount = Number((itemsCountRow as any)?.$extras?.c ?? 0)
    if (itemsCount > 0) {
      return response.badRequest({ message: 'El pedido ya tiene productos' })
    }

    stockRequest.status = 'cancelled'
    await stockRequest.save()

    return { ok: true }
  }
}
