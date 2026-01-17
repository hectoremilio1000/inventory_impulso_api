import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import PurchaseOrder from '#models/purchase_order'
import PurchaseOrderItem from '#models/purchase_order_item'
import InventoryPresentation from '#models/inventory_presentation'
import InventoryPresentationSupplierCost from '#models/inventory_presentation_supplier_cost'
import InventoryMovement from '#models/inventory_movement'
import InventoryStock from '#models/inventory_stock'
import { getRestaurantId } from '#utils/restaurant'
import { DateTime } from 'luxon'
import PurchaseRun from '#models/purchase_run'

export default class PurchaseOrdersController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const status = request.input('status')
    const supplierId = request.input('supplierId')
    const warehouseId = request.input('warehouseId')

    const query = PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .preload('supplier')
      .preload('purchaseRun') // ✅
      .preload('warehouse')
      .withCount('items')
      .orderBy('id', 'desc')

    if (status) query.where('status', String(status))
    if (supplierId) query.where('supplierId', Number(supplierId))
    if (warehouseId) query.where('warehouseId', Number(warehouseId))

    const rows = await query
    return rows.map((row) => ({
      ...row.serialize(),
      itemsCount: Number((row as any).$extras?.items_count ?? 0),
    }))
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const payload = request.only([
      'purchaseRunId',
      'supplierId',
      'warehouseId',
      'documentNumber',
      'invoiceNumber',
      'issueDate',
      'applicationDate',
      'dueDate',
      'status',
      'discountPercent',
      'discountAmount',
      'subtotal',
      'tax1Amount',
      'tax2Amount',
      'tax3Amount',
      'total',
      'isFiscal',
      'withholdingIsrPercent',
      'withholdingIvaPercent',
      'withholdingOtherPercent',
      'reference',
      'createdBy',
    ])

    if (payload.purchaseRunId) {
      await PurchaseRun.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.purchaseRunId))
        .firstOrFail()
    }

    // order_number es NOT NULL: si no viene, generamos siguiente por restaurante
    let orderNumber = request.input('orderNumber')
    if (!orderNumber) {
      const row = await PurchaseOrder.query()
        .where('restaurantId', restaurantId)
        // ✅ columna real en DB (snake_case)
        .max('order_number as max')
        .first()

      const max = Number((row as any)?.$extras?.max ?? 0)
      orderNumber = max + 1
    }

    const po = await PurchaseOrder.create({
      ...payload,
      purchaseRunId: payload.purchaseRunId ? Number(payload.purchaseRunId) : null,
      restaurantId,
      orderNumber,
    })
    return response.created(po)
  }

  public async show({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    return PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .preload('purchaseRun') // ✅
      .preload('supplier')
      .preload('warehouse')
      .preload('items', (q) => q.preload('presentation'))
      .firstOrFail()
  }

  // POST /purchase-orders/:id/items
  public async addItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const po = await PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    const payload = request.only([
      'presentationId',
      'quantity',
      'unitPrice',
      'discountAmount',
      'taxRate',
      'taxAmount',
      'lineSubtotal',
      'lineTotal',
      'notes',
    ])

    const item = await PurchaseOrderItem.create({ ...payload, purchaseOrderId: po.id })
    await item.load('presentation')

    if (po.supplierId && item.unitPrice !== null && item.unitPrice !== undefined) {
      let costRow = await InventoryPresentationSupplierCost.query()
        .where('restaurantId', restaurantId)
        .where('presentationId', item.presentationId)
        .where('supplierId', po.supplierId)
        .first()

      if (!costRow) {
        costRow = await InventoryPresentationSupplierCost.create({
          restaurantId,
          presentationId: item.presentationId,
          supplierId: po.supplierId,
          lastCost: Number(item.unitPrice),
          lastPurchaseAt: null,
        })
      } else {
        costRow.lastCost = Number(item.unitPrice)
        await costRow.save()
      }
    }
    return response.created(item)
  }

  // PUT /purchase-orders/:id/items/:itemId
  public async updateItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const po = await PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (po.purchaseRunId) {
      const run = await PurchaseRun.query()
        .where('restaurantId', restaurantId)
        .where('id', po.purchaseRunId)
        .firstOrFail()

      if (run.status !== 'draft') {
        return response.badRequest({ message: 'El viaje no está en borrador' })
      }
    }

    if (po.status !== 'draft' || po.receivedAt) {
      return response.badRequest({ message: 'La orden no está en borrador' })
    }

    const item = await PurchaseOrderItem.query()
      .where('purchaseOrderId', po.id)
      .where('id', params.itemId)
      .firstOrFail()

    const payload = request.only(['quantity', 'unitPrice', 'notes'])

    const nextQty = payload.quantity ?? item.quantity
    const nextUnitPrice = payload.unitPrice ?? item.unitPrice

    item.merge({
      quantity: nextQty,
      unitPrice: nextUnitPrice,
      notes: payload.notes ?? item.notes,
      lineSubtotal: Number(nextQty) * Number(nextUnitPrice),
      lineTotal: Number(nextQty) * Number(nextUnitPrice),
    })

    await item.save()
    await item.load('presentation')

    if (po.supplierId && item.unitPrice !== null && item.unitPrice !== undefined) {
      let costRow = await InventoryPresentationSupplierCost.query()
        .where('restaurantId', restaurantId)
        .where('presentationId', item.presentationId)
        .where('supplierId', po.supplierId)
        .first()

      if (!costRow) {
        costRow = await InventoryPresentationSupplierCost.create({
          restaurantId,
          presentationId: item.presentationId,
          supplierId: po.supplierId,
          lastCost: Number(item.unitPrice),
          lastPurchaseAt: null,
        })
      } else {
        costRow.lastCost = Number(item.unitPrice)
        await costRow.save()
      }
    }

    return item
  }

  // DELETE /purchase-orders/:id/items/:itemId
  public async destroyItem({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const po = await PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (po.purchaseRunId) {
      const run = await PurchaseRun.query()
        .where('restaurantId', restaurantId)
        .where('id', po.purchaseRunId)
        .firstOrFail()

      if (run.status !== 'draft') {
        return response.badRequest({ message: 'El viaje no está en borrador' })
      }
    }

    if (po.status !== 'draft' || po.receivedAt) {
      return response.badRequest({ message: 'La orden no está en borrador' })
    }

    const item = await PurchaseOrderItem.query()
      .where('purchaseOrderId', po.id)
      .where('id', params.itemId)
      .firstOrFail()

    await item.delete()
    return { ok: true }
  }

  // POST /purchase-orders/:id/receive
  // Crea movimientos + actualiza inventory_stocks
  public async receive({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const po = await PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .preload('items')
      .firstOrFail()

    const itemsPayload = Array.isArray(request.input('items')) ? request.input('items') : []
    const receivedQtyMap = new Map<number, number>()
    const unitPriceMap = new Map<number, number>()
    for (const row of itemsPayload) {
      const id = Number(row?.id)
      if (!Number.isFinite(id)) continue
      const qty = row?.receivedQty
      if (qty === null || qty === undefined || Number.isNaN(Number(qty))) continue
      receivedQtyMap.set(id, Number(qty))

      const unitPrice = row?.unitPrice
      if (unitPrice !== null && unitPrice !== undefined && Number.isFinite(Number(unitPrice))) {
        unitPriceMap.set(id, Number(unitPrice))
      }
    }

    const receivedAtRaw = request.input('receivedAt')
    const receivedAt = receivedAtRaw ? DateTime.fromISO(String(receivedAtRaw)) : DateTime.now()

    // si no hay applicationDate, usa receivedAt como fecha de movimiento
    const movementAt = po.applicationDate ?? receivedAt

    await db.transaction(async (trx) => {
      po.useTransaction(trx)
      po.status = 'received'
      po.receivedAt = receivedAt
      await po.save()

      for (const it of po.items) {
        const receivedQty = receivedQtyMap.has(it.id)
          ? Number(receivedQtyMap.get(it.id))
          : Number(it.quantity)

        it.useTransaction(trx)
        it.receivedQty = receivedQty

        const nextUnitPrice = unitPriceMap.has(it.id)
          ? Number(unitPriceMap.get(it.id))
          : Number(it.unitPrice)

        if (unitPriceMap.has(it.id)) {
          it.unitPrice = nextUnitPrice
          const orderQty = Number(it.quantity ?? 0)
          it.lineSubtotal = orderQty * nextUnitPrice
          it.lineTotal = orderQty * nextUnitPrice
        }

        await it.save()

        if (!receivedQty || receivedQty <= 0) {
          continue
        }

        const pres = await InventoryPresentation.query({ client: trx })
          .where('id', it.presentationId)
          .preload('item')
          .firstOrFail()

        const qtyBase = Number(receivedQty) * Number(pres.contentInBaseUnit)
        const unitCostBase = Number(it.unitPrice) / Number(pres.contentInBaseUnit)
        const totalCost = Number(it.unitPrice) * Number(receivedQty)

        await InventoryMovement.create(
          {
            restaurantId,
            warehouseId: po.warehouseId,
            inventoryItemId: pres.inventoryItemId,
            presentationId: pres.id,
            movementType: 'purchase',
            quantityBase: qtyBase,
            unitCost: unitCostBase,
            totalCost,
            movementAt,
            referenceType: 'purchase_order_item',
            referenceId: it.id,
            notes: `PO #${po.orderNumber}`,
          },
          { client: trx }
        )

        // upsert stock
        const stock = await InventoryStock.query({ client: trx })
          .where('restaurantId', restaurantId)
          .where('warehouseId', po.warehouseId)
          .where('inventoryItemId', pres.inventoryItemId)
          .first()

        if (!stock) {
          await InventoryStock.create(
            {
              restaurantId,
              warehouseId: po.warehouseId,
              inventoryItemId: pres.inventoryItemId,
              qtyOnHandBase: qtyBase,
              avgCost: unitCostBase,
              lastMovementAt: movementAt,
            },
            { client: trx }
          )
        } else {
          // promedio ponderado simple
          const oldQty = Number(stock.qtyOnHandBase)
          const newQty = oldQty + qtyBase
          const oldCost = Number(stock.avgCost ?? unitCostBase)
          const newCost = (oldQty * oldCost + qtyBase * unitCostBase) / (newQty || 1)

          stock.useTransaction(trx)
          stock.qtyOnHandBase = newQty
          stock.avgCost = newCost
          stock.lastMovementAt = movementAt
          await stock.save()
        }

        if (po.supplierId) {
          let costRow = await InventoryPresentationSupplierCost.query({ client: trx })
            .where('restaurantId', restaurantId)
            .where('presentationId', pres.id)
            .where('supplierId', po.supplierId)
            .first()

          if (!costRow) {
            costRow = await InventoryPresentationSupplierCost.create(
              {
                restaurantId,
                presentationId: pres.id,
                supplierId: po.supplierId,
                lastCost: Number(it.unitPrice),
                lastPurchaseAt: receivedAt,
              },
              { client: trx }
            )
          } else {
            costRow.useTransaction(trx)
            costRow.lastCost = Number(it.unitPrice)
            costRow.lastPurchaseAt = receivedAt
            await costRow.save()
          }
        }
      }
    })

    return { ok: true }
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const po = await PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    const payload = request.only([
      'supplierId',
      'warehouseId',
      'applicationDate',
      'reference',
      'status',
      'documentNumber',
      'invoiceNumber',
      'issueDate',
      'dueDate',
      'isFiscal',
    ])

    po.merge(payload)
    await po.save()

    return po
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const po = await PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    if (po.purchaseRunId) {
      const run = await PurchaseRun.query()
        .where('restaurantId', restaurantId)
        .where('id', po.purchaseRunId)
        .firstOrFail()

      if (run.status !== 'draft') {
        return response.badRequest({ message: 'El viaje no está en borrador' })
      }
    }

    if (po.status !== 'draft' || po.receivedAt) {
      return response.badRequest({ message: 'La orden no está en borrador' })
    }

    const itemsCountRow = await PurchaseOrderItem.query()
      .where('purchaseOrderId', po.id)
      .count('* as c')
      .first()

    const itemsCount = Number((itemsCountRow as any)?.$extras?.c ?? 0)
    if (itemsCount > 0) {
      return response.badRequest({ message: 'La orden ya tiene productos' })
    }

    po.status = 'cancelled'
    po.cancelledBy = request.input('cancelledBy') ? String(request.input('cancelledBy')) : null
    await po.save()

    return { ok: true }
  }
}
