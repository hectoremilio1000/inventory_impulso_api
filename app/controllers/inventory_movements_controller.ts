import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import InventoryMovement from '#models/inventory_movement'
import InventoryStock from '#models/inventory_stock'
import InventoryWarehouse from '#models/inventory_warehouse'
import InventoryItem from '#models/inventory_item'
import { getRestaurantId } from '#utils/restaurant'

export default class InventoryMovementsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const warehouseId = request.input('warehouseId')
    const inventoryItemId = request.input('inventoryItemId')
    const movementId = request.input('movementId')
    const movementTypeRaw = request.input('movementType')
    const startAtRaw = request.input('startAt')
    const endAtRaw = request.input('endAt')
    const limitRaw = request.input('limit')

    const query = InventoryMovement.query()
      .where('restaurantId', restaurantId)
      .preload('warehouse')
      .preload('item', (q) => q.preload('unit'))
      .orderBy('movementAt', 'desc')
      .orderBy('id', 'desc')

    if (movementId) query.where('id', Number(movementId))
    if (warehouseId) query.where('warehouseId', Number(warehouseId))
    if (inventoryItemId) query.where('inventoryItemId', Number(inventoryItemId))

    const movementTypes = Array.isArray(movementTypeRaw)
      ? movementTypeRaw
      : typeof movementTypeRaw === 'string'
        ? movementTypeRaw.split(',').map((t) => t.trim()).filter(Boolean)
        : []
    if (movementTypes.length) {
      query.whereIn('movementType', movementTypes)
    }

    if (startAtRaw) {
      const startAt = DateTime.fromISO(String(startAtRaw))
      if (startAt.isValid) query.where('movementAt', '>=', startAt.toJSDate())
    }
    if (endAtRaw) {
      const endAt = DateTime.fromISO(String(endAtRaw))
      if (endAt.isValid) query.where('movementAt', '<=', endAt.toJSDate())
    }

    const limit = Number(limitRaw)
    if (Number.isFinite(limit) && limit > 0) {
      query.limit(limit)
    } else {
      query.limit(200)
    }

    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only([
      'warehouseId',
      'inventoryItemId',
      'qtyBase',
      'direction',
      'reasonText',
      'notes',
      'movementAt',
    ])

    const warehouseId = Number(payload.warehouseId)
    const inventoryItemId = Number(payload.inventoryItemId)
    const qtyBase = Number(payload.qtyBase ?? 0)
    const direction = String(payload.direction ?? '').toLowerCase()
    const reasonText = String(payload.reasonText ?? '').trim()

    if (!warehouseId || !inventoryItemId) {
      return response.badRequest({ message: 'warehouseId e inventoryItemId requeridos' })
    }
    if (!qtyBase || qtyBase <= 0) {
      return response.badRequest({ message: 'qtyBase debe ser mayor a 0' })
    }
    if (direction !== 'in' && direction !== 'out') {
      return response.badRequest({ message: 'direction inválido (in|out)' })
    }
    if (!reasonText) {
      return response.badRequest({ message: 'reasonText requerido' })
    }

    const warehouse = await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', warehouseId)
      .first()
    if (!warehouse) {
      return response.badRequest({ message: 'warehouseId inválido' })
    }

    const item = await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', inventoryItemId)
      .first()
    if (!item) {
      return response.badRequest({ message: 'inventoryItemId inválido' })
    }

    const movementAt = payload.movementAt
      ? DateTime.fromISO(String(payload.movementAt))
      : DateTime.now()

    const movementQty = direction === 'out' ? -Math.abs(qtyBase) : Math.abs(qtyBase)
    const notes = payload.notes ? `${reasonText} — ${String(payload.notes).trim()}` : reasonText

    const result = await db.transaction(async (trx) => {
      const stock = await InventoryStock.query({ client: trx })
        .where('restaurantId', restaurantId)
        .where('warehouseId', warehouseId)
        .where('inventoryItemId', inventoryItemId)
        .first()

      const unitCost = stock?.avgCost ?? null
      const totalCost = unitCost !== null ? Math.abs(movementQty) * Number(unitCost) : null

      const movement = await InventoryMovement.create(
        {
          restaurantId,
          warehouseId,
          inventoryItemId,
          presentationId: null,
          movementType: 'manual_adjustment',
          quantityBase: movementQty,
          unitCost,
          totalCost,
          movementAt,
          referenceType: 'manual_adjustment',
          referenceId: null,
          notes,
        },
        { client: trx }
      )

      if (!stock) {
        await InventoryStock.create(
          {
            restaurantId,
            warehouseId,
            inventoryItemId,
            qtyOnHandBase: movementQty,
            avgCost: unitCost,
            lastMovementAt: movementAt,
          },
          { client: trx }
        )
      } else {
        stock.useTransaction(trx)
        stock.qtyOnHandBase = Number(stock.qtyOnHandBase) + movementQty
        stock.lastMovementAt = movementAt
        await stock.save()
      }

      await movement.load('warehouse')
      await movement.load('item', (q) => q.preload('unit'))
      return movement
    })

    return response.created(result)
  }
}
