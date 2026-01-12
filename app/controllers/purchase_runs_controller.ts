import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import PurchaseRun from '#models/purchase_run'
import PurchaseOrder from '#models/purchase_order'
import StockRequest from '#models/stock_request'
import { getRestaurantId } from '#utils/restaurant'

function formatRunCode(runAt: DateTime, runNumber: number) {
  const date = runAt.toFormat('yyyy-LL-dd') // 2025-12-26
  const seq = String(runNumber).padStart(2, '0') // 01,02...
  return `RUN-${date}-${seq}`
}

export default class PurchaseRunsController {
  // GET /api/purchase-runs?status=in_progress
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const status = String(request.input('status') ?? '').trim()

    const q = PurchaseRun.query().where('restaurantId', restaurantId).orderBy('id', 'desc')

    if (status) q.where('status', status)

    return q
  }

  // POST /api/purchase-runs
  // body: { title?, runAt?, notes?, createdBy? }
  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const title = request.input('title') ? String(request.input('title')) : null
    const notes = request.input('notes') ? String(request.input('notes')) : null
    const createdBy = request.input('createdBy') ? String(request.input('createdBy')) : null

    const runAtRaw = request.input('runAt')
    const runAt = runAtRaw ? DateTime.fromISO(String(runAtRaw)) : DateTime.now()

    // ✅ Generar runNumber de forma razonable + retry por unique
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const created = await db.transaction(async (trx) => {
          // último run del restaurante (bloqueo optimista)
          const last = await PurchaseRun.query({ client: trx })
            .where('restaurantId', restaurantId)
            .orderBy('runNumber', 'desc')
            .first()

          const runNumber = (last?.runNumber ?? 0) + 1
          const runCode = formatRunCode(runAt, runNumber)

          const row = await PurchaseRun.create(
            {
              restaurantId,
              runNumber,
              runCode,
              title,
              runAt,
              status: 'draft',
              notes,
              createdBy,
            },
            { client: trx }
          )

          return row
        })

        return response.created(created)
      } catch (e: any) {
        // retry si chocó por unique(restaurant_id, run_number)
        const msg = String(e?.message ?? '')
        if (
          msg.includes('purchase_runs_restaurant_id_run_number_unique') ||
          msg.includes('unique')
        ) {
          continue
        }
        throw e
      }
    }

    return response.status(409).send({
      code: 'RUN_CREATE_CONFLICT',
      message: 'No se pudo crear el viaje (conflicto de consecutivo). Intenta de nuevo.',
    })
  }

  // GET /api/purchase-runs/:id
  public async show({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const run = await PurchaseRun.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    // Trae compras dentro del run (con preload útil)
    const orders = await PurchaseOrder.query()
      .where('restaurantId', restaurantId)
      .where('purchaseRunId', run.id)
      .preload('supplier')
      .preload('warehouse')
      .orderBy('id', 'desc')

    const requests = await StockRequest.query()
      .where('restaurantId', restaurantId)
      .where('purchaseRunId', run.id)
      .preload('warehouse')
      .orderBy('id', 'desc')

    return {
      ...run.serialize(),
      purchaseOrders: orders.map((o) => o.serialize()),
      stockRequests: requests.map((r) => r.serialize()),
    }
  }

  // POST /api/purchase-runs/:id/close
  public async close({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const closedBy = request.input('closedBy') ? String(request.input('closedBy')) : null

    const run = await PurchaseRun.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    run.status = 'closed'
    run.closedBy = closedBy
    await run.save()

    return { ok: true }
  }

  // POST /api/purchase-runs/:id/reopen
  public async reopen({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const run = await PurchaseRun.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    run.status = 'draft'
    run.closedBy = null
    await run.save()

    return { ok: true }
  }
}
