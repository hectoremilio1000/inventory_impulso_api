import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import StockCount from '#models/stock_count'
import StockCountItem from '#models/stock_count_item'
import InventoryStock from '#models/inventory_stock'
import InventoryMovement from '#models/inventory_movement'
import { getRestaurantId } from '#utils/restaurant'
import { DateTime } from 'luxon'

export default class StockCountsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const status = request.input('status')
    const warehouseId = request.input('warehouseId')

    const q = StockCount.query()
      .where('restaurantId', restaurantId)
      .whereNull('deletedAt')
      .preload('warehouse')
      .orderBy('id', 'desc')
    if (status) q.where('status', String(status))
    if (warehouseId) q.where('warehouseId', Number(warehouseId))
    const rows = await q.withCount('items')
    return rows.map((row) => ({
      ...row.serialize(),
      itemsCount: Number((row as any).$extras?.items_count ?? 0),
    }))
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['warehouseId', 'startedAt', 'notes', 'createdBy', 'countedBy'])
    const row = await StockCount.create({
      restaurantId,
      warehouseId: payload.warehouseId,
      startedAt: payload.startedAt ? DateTime.fromISO(String(payload.startedAt)) : DateTime.now(),
      notes: payload.notes,
      createdBy: payload.createdBy,
      countedBy: payload.countedBy,
      status: 'in_progress',
    })
    return response.created(row)
  }

  public async show({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    return StockCount.query()
      .where('restaurantId', restaurantId)
      .whereNull('deletedAt')
      .where('id', params.id)
      .preload('warehouse')
      .preload('items', (q) => q.preload('item').preload('presentation'))
      .firstOrFail()
  }

  // POST /stock-counts/:id/items
  public async addItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const stockCount = await StockCount.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (stockCount.status !== 'in_progress') {
      return response.badRequest({ message: 'El conteo no está en progreso' })
    }

    const payload = request.only(['inventoryItemId', 'presentationId', 'countedQtyBase', 'notes'])

    const invStock = await InventoryStock.query()
      .where('restaurantId', restaurantId)
      .where('warehouseId', stockCount.warehouseId)
      .where('inventoryItemId', payload.inventoryItemId)
      .first()

    const theoretical = Number(invStock?.qtyOnHandBase ?? 0)
    const counted = Number(payload.countedQtyBase ?? 0)
    const diff = counted - theoretical

    const unitCost = invStock?.avgCost ?? null
    const diffTotal = unitCost !== null ? diff * Number(unitCost) : null

    const item = await StockCountItem.create({
      stockCountId: stockCount.id,
      inventoryItemId: payload.inventoryItemId,
      presentationId: payload.presentationId ?? null,
      theoreticalQtyBase: theoretical,
      countedQtyBase: counted,
      differenceQtyBase: diff,
      unitCostAtCount: unitCost,
      differenceTotalCost: diffTotal,
      notes: payload.notes,
    })

    await item.load('item')
    await item.load('presentation')

    return response.created(item)
  }

  // PATCH /stock-counts/:id/items/:itemId
  public async updateItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockCount = await StockCount.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (stockCount.status !== 'in_progress') {
      return response.badRequest({ message: 'El conteo no está en progreso' })
    }

    const item = await StockCountItem.query()
      .where('stockCountId', stockCount.id)
      .where('id', params.itemId)
      .firstOrFail()

    const payload = request.only(['countedQtyBase', 'presentationId', 'notes'])

    const counted =
      payload.countedQtyBase !== undefined
        ? Number(payload.countedQtyBase)
        : Number(item.countedQtyBase)
    const diff = counted - Number(item.theoreticalQtyBase)

    item.merge({
      countedQtyBase: counted,
      differenceQtyBase: diff,
      presentationId: payload.presentationId ?? item.presentationId,
      notes: payload.notes ?? item.notes,
    })

    if (item.unitCostAtCount !== null && item.unitCostAtCount !== undefined) {
      item.differenceTotalCost = diff * Number(item.unitCostAtCount)
    }

    await item.save()
    return item
  }

  // DELETE /stock-counts/:id/items/:itemId
  public async destroyItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockCount = await StockCount.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (stockCount.status !== 'in_progress') {
      return response.badRequest({ message: 'El conteo no está en progreso' })
    }

    const item = await StockCountItem.query()
      .where('stockCountId', stockCount.id)
      .where('id', params.itemId)
      .firstOrFail()

    await item.delete()
    return response.noContent()
  }

  // POST /stock-counts/:id/close  -> genera ajustes y actualiza inventory_stocks
  public async close({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockCount = await StockCount.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .preload('items')
      .firstOrFail()

    if (stockCount.status !== 'in_progress') {
      return response.badRequest({ message: 'El conteo no está en progreso' })
    }

    const closedBy = request.input('closedBy')
    const movementAt = DateTime.now()

    await db.transaction(async (trx) => {
      stockCount.useTransaction(trx)

      for (const it of stockCount.items) {
        const diff = Number(it.differenceQtyBase)
        if (!diff) continue

        // movimiento ajuste
        await InventoryMovement.create(
          {
            restaurantId,
            warehouseId: stockCount.warehouseId,
            inventoryItemId: it.inventoryItemId,
            presentationId: it.presentationId ?? null,
            movementType: 'stock_count_adjustment',
            quantityBase: diff,
            unitCost: it.unitCostAtCount ?? null,
            totalCost: it.unitCostAtCount ? diff * Number(it.unitCostAtCount) : null,
            movementAt,
            referenceType: 'stock_count',
            referenceId: stockCount.id,
            notes: 'Ajuste por conteo físico',
          },
          { client: trx }
        )

        // aplicar al stock
        const stock = await InventoryStock.query({ client: trx })
          .where('restaurantId', restaurantId)
          .where('warehouseId', stockCount.warehouseId)
          .where('inventoryItemId', it.inventoryItemId)
          .first()

        if (!stock) {
          await InventoryStock.create(
            {
              restaurantId,
              warehouseId: stockCount.warehouseId,
              inventoryItemId: it.inventoryItemId,
              qtyOnHandBase: Number(it.countedQtyBase),
              avgCost: it.unitCostAtCount ?? null,
              lastMovementAt: movementAt,
            },
            { client: trx }
          )
        } else {
          stock.useTransaction(trx)
          stock.qtyOnHandBase = Number(stock.qtyOnHandBase) + diff
          stock.lastMovementAt = movementAt
          await stock.save()
        }
      }

      stockCount.status = 'closed'
      stockCount.finishedAt = movementAt
      stockCount.closedBy = closedBy
      await stockCount.save()
    })

    return { ok: true }
  }

  // DELETE /stock-counts/:id
  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const stockCount = await StockCount.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (stockCount.status !== 'in_progress') {
      return response.badRequest({ message: 'El conteo no está en progreso' })
    }

    const itemsCountRow = await StockCountItem.query()
      .where('stockCountId', stockCount.id)
      .count('* as c')
      .first()

    const itemsCount = Number((itemsCountRow as any)?.$extras?.c ?? 0)
    if (itemsCount > 0) {
      return response.badRequest({ message: 'El conteo ya tiene items' })
    }

    stockCount.status = 'cancelled'
    stockCount.deletedAt = DateTime.now()
    await stockCount.save()
    return response.noContent()
  }
}
