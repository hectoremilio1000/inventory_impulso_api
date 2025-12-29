import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import InventoryStock from '#models/inventory_stock'
import InventoryMovement from '#models/inventory_movement'
import { getRestaurantId } from '#utils/restaurant'

type SalesLine = {
  restaurantId: number
  soldAt: string
  orderId: number
  orderItemId: number
  productId: number
  productCode?: string | null
  qty: number
  printAreaId: number | null
  printAreaName?: string | null
  modifiers?: Array<{ modifierProductId: number; qty: number }>
}

export default class InventorySalesConsumptionController {
  public async apply({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const from = String(request.input('from') || '').trim()
    const to = String(request.input('to') || '').trim()
    const limit = Math.min(Number(request.input('limit', 5000)) || 5000, 20000)

    if (!from || !to) {
      return response.badRequest({
        error: 'missing_from_or_to',
        hint: 'use ?from=YYYY-MM-DD&to=YYYY-MM-DD',
      })
    }

    const orderApiBase = String(process.env.ORDER_API_BASE_URL || '').trim()
    if (!orderApiBase) return response.badRequest({ error: 'missing_ORDER_API_BASE_URL' })

    // Lee Authorization sin pelear por casing
    const auth = String(
      request.header('authorization') || request.header('Authorization') || ''
    ).trim()
    if (!auth) return response.unauthorized({ error: 'missing_authorization_header' })

    const url =
      `${orderApiBase.replace(/\/$/, '')}/api/sales-lines` +
      `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${limit}`

    // Asegura formato Bearer
    const bearer = auth.startsWith('Bearer ') ? auth : `Bearer ${auth}`

    // ✅ manda header en minúsculas (tu middleware en order-api lee 'authorization')
    const r = await fetch(url, {
      headers: {
        authorization: bearer,
      },
    })

    if (!r.ok) {
      const txt = await r.text()
      return response.badRequest({ error: 'order_api_failed', status: r.status, details: txt })
    }

    const payload = (await r.json()) as { lines?: SalesLine[] }
    const lines: SalesLine[] = Array.isArray(payload.lines) ? payload.lines : []

    let appliedComponents = 0
    let skippedAlreadyApplied = 0
    let skippedNoMap = 0
    let skippedNoRecipe = 0
    let skippedNoRecipeLines = 0

    await db.transaction(async (trx) => {
      for (const line of lines) {
        const orderItemId = Number(line.orderItemId || 0)
        if (!orderItemId) continue

        // 1) Resolver warehouse por printAreaId
        const printAreaId = Number(line.printAreaId || 0)
        const map = await trx
          .from('print_area_warehouse_maps')
          .where('restaurant_id', restaurantId)
          .where('print_area_id', printAreaId)
          .first()

        const warehouseId = Number(map?.warehouse_id || 0)
        if (!warehouseId) {
          skippedNoMap++
          continue
        }

        // 2) Componentes a consumir: producto principal + modifiers
        const itemsToConsume: Array<{ posProductId: number; qty: number }> = [
          { posProductId: Number(line.productId), qty: Number(line.qty || 0) },
        ]

        for (const m of line.modifiers || []) {
          const modPid = Number(m.modifierProductId || 0)
          const modQty = Number(m.qty || 0)
          if (modPid && modQty) {
            // si vendiste 2 burgers y el extra qty=1, consumo del extra = 2
            itemsToConsume.push({ posProductId: modPid, qty: modQty * Number(line.qty || 0) })
          }
        }

        const movementAt = DateTime.fromISO(String(line.soldAt)).isValid
          ? DateTime.fromISO(String(line.soldAt))
          : DateTime.now()

        for (const consumeTarget of itemsToConsume) {
          // 3) Buscar receta (header)
          const recipe = await trx
            .from('inventory_recipes')
            .where('restaurant_id', restaurantId)
            .where('pos_product_id', consumeTarget.posProductId)
            .where('is_active', true)
            .first()

          if (!recipe?.id) {
            skippedNoRecipe++
            continue
          }

          // 4) Cargar líneas de receta ANTES de marcar idempotencia
          const recipeLines = await trx
            .from('inventory_recipe_lines')
            .where('recipe_id', Number(recipe.id))

          // ✅ si no hay líneas, NO marcamos external_ref
          if (!recipeLines || recipeLines.length === 0) {
            skippedNoRecipeLines++
            continue
          }

          // 5) Idempotencia por componente (orderItemId:posProductId)
          const now = DateTime.now().toSQL({ includeOffset: false })
          const refId = `${orderItemId}:${consumeTarget.posProductId}`

          const meta = {
            orderId: line.orderId,
            orderItemId,
            soldAt: line.soldAt,
            posProductId: consumeTarget.posProductId,
            qty: consumeTarget.qty,
            printAreaId: line.printAreaId ?? null,
            printAreaName: line.printAreaName ?? null,
            source: 'pos-order',
          }

          const res = await trx.rawQuery(
            `
            INSERT INTO inventory_external_refs
              (restaurant_id, source, ref_type, ref_id, meta, applied_at, created_at, updated_at)
            VALUES
              (?, ?, ?, ?, ?::jsonb, ?, ?, ?)
            ON CONFLICT (restaurant_id, source, ref_type, ref_id)
            DO NOTHING
            RETURNING id
            `,
            [
              restaurantId,
              'pos-order',
              'order_item_product',
              refId,
              JSON.stringify(meta),
              now,
              now,
              now,
            ]
          )

          const didInsert = Array.isArray((res as any)?.rows) && (res as any).rows.length > 0
          if (!didInsert) {
            skippedAlreadyApplied++
            continue
          }

          // 6) Aplicar líneas de receta
          for (const rl of recipeLines) {
            const inventoryItemId = Number(rl.inventory_item_id)
            const basePerUnit = Number(rl.qty_base)
            const waste =
              rl.waste_percent === null || rl.waste_percent === undefined
                ? 0
                : Number(rl.waste_percent)

            const consumeBase = basePerUnit * consumeTarget.qty * (1 + waste)
            if (!consumeBase) continue

            const qtyBase = -consumeBase

            const stock = await InventoryStock.query({ client: trx })
              .where('restaurantId', restaurantId)
              .where('warehouseId', warehouseId)
              .where('inventoryItemId', inventoryItemId)
              .first()

            const unitCost = stock?.avgCost ?? null
            const totalCost = unitCost !== null ? Math.abs(qtyBase) * Number(unitCost) : null

            await InventoryMovement.create(
              {
                restaurantId,
                warehouseId,
                inventoryItemId,
                presentationId: null,
                movementType: 'sale_consumption',
                quantityBase: qtyBase,
                unitCost,
                totalCost,
                movementAt,
                referenceType: 'pos_order_item',
                referenceId: orderItemId,
                notes: `Consumo por venta order#${line.orderId} item#${orderItemId} product#${consumeTarget.posProductId}`,
              },
              { client: trx }
            )

            if (!stock) {
              await InventoryStock.create(
                {
                  restaurantId,
                  warehouseId,
                  inventoryItemId,
                  qtyOnHandBase: qtyBase,
                  avgCost: unitCost,
                  lastMovementAt: movementAt,
                },
                { client: trx }
              )
            } else {
              stock.useTransaction(trx)
              stock.qtyOnHandBase = Number(stock.qtyOnHandBase) + qtyBase
              stock.lastMovementAt = movementAt
              await stock.save()
            }
          }

          appliedComponents++
        }
      }
    })

    return response.ok({
      ok: true,
      range: { from, to },
      fetched: lines.length,
      appliedComponents,
      skipped: {
        alreadyApplied: skippedAlreadyApplied,
        noMap: skippedNoMap,
        noRecipe: skippedNoRecipe,
        noRecipeLines: skippedNoRecipeLines,
      },
    })
  }
}
