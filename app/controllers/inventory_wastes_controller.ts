import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import InventoryWaste from '#models/inventory_waste'
import InventoryWarehouse from '#models/inventory_warehouse'
import InventoryItem from '#models/inventory_item'
import InventoryStock from '#models/inventory_stock'
import InventoryMovement from '#models/inventory_movement'
import { getRestaurantId } from '#utils/restaurant'
import db from '@adonisjs/lucid/services/db'

export default class InventoryWastesController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const status = request.input('status')
    const warehouseId = request.input('warehouseId')
    const inventoryItemId = request.input('inventoryItemId')
    const q = String(request.input('q') ?? '').trim()

    const query = InventoryWaste.query()
      .where('restaurantId', restaurantId)
      .preload('warehouse')
      .preload('item', (q) => q.preload('unit'))
      .orderBy('reportedAt', 'desc')
      .orderBy('id', 'desc')

    if (status) query.where('status', String(status))
    if (warehouseId) query.where('warehouseId', Number(warehouseId))
    if (inventoryItemId) query.where('inventoryItemId', Number(inventoryItemId))
    if (q) query.whereILike('reasonText', `%${q}%`)

    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only([
      'warehouseId',
      'inventoryItemId',
      'qtyBase',
      'reasonText',
      'notes',
      'reportedAt',
    ])

    const warehouseId = Number(payload.warehouseId)
    const inventoryItemId = Number(payload.inventoryItemId)
    const qtyBase = Number(payload.qtyBase ?? 0)
    const reasonText = String(payload.reasonText ?? '').trim()

    if (!warehouseId || !inventoryItemId) {
      return response.badRequest({ message: 'warehouseId e inventoryItemId requeridos' })
    }
    if (!qtyBase || qtyBase <= 0) {
      return response.badRequest({ message: 'qtyBase debe ser mayor a 0' })
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

    const stock = await InventoryStock.query()
      .where('restaurantId', restaurantId)
      .where('warehouseId', warehouseId)
      .where('inventoryItemId', inventoryItemId)
      .first()

    const unitCost = stock?.avgCost ?? null
    const totalCost = unitCost !== null ? Number(unitCost) * qtyBase : null

    const reportedAt = payload.reportedAt
      ? DateTime.fromISO(String(payload.reportedAt))
      : DateTime.now()

    const row = await InventoryWaste.create({
      restaurantId,
      warehouseId,
      inventoryItemId,
      qtyBase,
      unitCost,
      totalCost,
      reasonText,
      notes: payload.notes ?? null,
      status: 'pending',
      reportedAt,
    })

    await row.load('warehouse')
    await row.load('item', (q) => q.preload('unit'))

    return response.created(row)
  }

  public async update({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const waste = await InventoryWaste.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .first()

    if (!waste) {
      return response.notFound({ message: 'Merma no encontrada' })
    }

    if (String(waste.status) !== 'pending') {
      return response.badRequest({ message: 'Solo puedes editar mermas pendientes' })
    }

    const payload = request.only([
      'warehouseId',
      'inventoryItemId',
      'qtyBase',
      'reasonText',
      'notes',
      'reportedAt',
    ])

    const nextWarehouseId =
      payload.warehouseId !== undefined ? Number(payload.warehouseId) : waste.warehouseId
    const nextItemId =
      payload.inventoryItemId !== undefined ? Number(payload.inventoryItemId) : waste.inventoryItemId
    const nextQty =
      payload.qtyBase !== undefined ? Number(payload.qtyBase) : Number(waste.qtyBase)
    const nextReason =
      payload.reasonText !== undefined ? String(payload.reasonText).trim() : waste.reasonText

    if (!nextWarehouseId || !nextItemId) {
      return response.badRequest({ message: 'warehouseId e inventoryItemId requeridos' })
    }
    if (!nextQty || nextQty <= 0) {
      return response.badRequest({ message: 'qtyBase debe ser mayor a 0' })
    }
    if (!nextReason) {
      return response.badRequest({ message: 'reasonText requerido' })
    }

    const warehouse = await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', nextWarehouseId)
      .first()
    if (!warehouse) {
      return response.badRequest({ message: 'warehouseId inválido' })
    }

    const item = await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', nextItemId)
      .first()
    if (!item) {
      return response.badRequest({ message: 'inventoryItemId inválido' })
    }

    const stock = await InventoryStock.query()
      .where('restaurantId', restaurantId)
      .where('warehouseId', nextWarehouseId)
      .where('inventoryItemId', nextItemId)
      .first()

    const unitCost = stock?.avgCost ?? null
    const totalCost = unitCost !== null ? Number(unitCost) * nextQty : null

    const reportedAt = payload.reportedAt
      ? DateTime.fromISO(String(payload.reportedAt))
      : waste.reportedAt

    waste.merge({
      warehouseId: nextWarehouseId,
      inventoryItemId: nextItemId,
      qtyBase: nextQty,
      unitCost,
      totalCost,
      reasonText: nextReason,
      notes: payload.notes ?? waste.notes ?? null,
      reportedAt,
    })

    await waste.save()
    await waste.load('warehouse')
    await waste.load('item', (q) => q.preload('unit'))

    return response.ok(waste)
  }

  public async apply({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const waste = await InventoryWaste.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .first()

    if (!waste) {
      return response.notFound({ message: 'Merma no encontrada' })
    }

    if (String(waste.status) !== 'pending') {
      return response.badRequest({ message: 'La merma no está pendiente' })
    }

    const qtyBase = Number(waste.qtyBase || 0)
    if (!qtyBase) {
      return response.badRequest({ message: 'La merma no tiene cantidad' })
    }

    const movementAt = waste.reportedAt ?? DateTime.now()
    const movementQty = -Math.abs(qtyBase)

    await db.transaction(async (trx) => {
      waste.useTransaction(trx)

      const stock = await InventoryStock.query({ client: trx })
        .where('restaurantId', restaurantId)
        .where('warehouseId', waste.warehouseId)
        .where('inventoryItemId', waste.inventoryItemId)
        .first()

      const unitCost =
        waste.unitCost !== null && waste.unitCost !== undefined
          ? Number(waste.unitCost)
          : stock?.avgCost ?? null
      const totalCost = unitCost !== null ? Math.abs(movementQty) * Number(unitCost) : null

      const movement = await InventoryMovement.create(
        {
          restaurantId,
          warehouseId: waste.warehouseId,
          inventoryItemId: waste.inventoryItemId,
          presentationId: null,
          movementType: 'waste',
          quantityBase: movementQty,
          unitCost,
          totalCost,
          movementAt,
          referenceType: 'waste',
          referenceId: waste.id,
          notes: waste.reasonText,
        },
        { client: trx }
      )

      waste.status = 'applied'
      waste.appliedMovementId = movement.id
      await waste.save()

      if (!stock) {
        await InventoryStock.create(
          {
            restaurantId,
            warehouseId: waste.warehouseId,
            inventoryItemId: waste.inventoryItemId,
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
    })

    await waste.load('warehouse')
    await waste.load('item', (q) => q.preload('unit'))

    return response.ok(waste)
  }
}
