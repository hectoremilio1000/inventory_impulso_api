import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import PurchaseOrder from '#models/purchase_order'
import PurchaseOrderItem from '#models/purchase_order_item'
import InventoryPresentation from '#models/inventory_presentation'
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
      .orderBy('id', 'desc')

    if (status) query.where('status', String(status))
    if (supplierId) query.where('supplierId', Number(supplierId))
    if (warehouseId) query.where('warehouseId', Number(warehouseId))

    return query
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
    return response.created(item)
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
        const pres = await InventoryPresentation.query({ client: trx })
          .where('id', it.presentationId)
          .preload('item')
          .firstOrFail()

        const qtyBase = Number(it.quantity) * Number(pres.contentInBaseUnit)
        const unitCostBase = Number(it.unitPrice) / Number(pres.contentInBaseUnit)
        const totalCost = Number(it.unitPrice) * Number(it.quantity)

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
}
