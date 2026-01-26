import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import StockCount from '#models/stock_count'
import { DateTime } from 'luxon'
import { getRestaurantId } from '#utils/restaurant'

type CutRow = {
  inventoryItemId: number
  code: string | null
  name: string | null
  unitCode: string | null
  initialQtyBase: number
  movementQtyBase: number
  theoreticalQtyBase: number
  finalQtyBase: number | null
  diffQtyBase: number | null
  unitCost: number | null
  diffCost: number | null
}

type CutTotals = {
  initialQtyBase: number
  movementQtyBase: number
  theoreticalQtyBase: number
  finalQtyBase: number | null
  diffQtyBase: number | null
  diffCost: number | null
}

type CutResponse = {
  ok: true
  range: { start: string; end: string }
  warehouseId: number
  initialCount: { id: number; finishedAt?: string | null }
  finalCount: { id: number; finishedAt?: string | null } | null
  movementTypes: string[]
  totals: CutTotals
  rows: CutRow[]
}

type ComputeResult =
  | {
      ok: true
      data: CutResponse
      meta: {
        compareMode: 'theoretical' | 'count'
        itemScope: 'all' | 'selected'
        itemIds: number[]
        movementTypes: string[]
        initialCountId: number
        finalCountId: number | null
        warehouseId: number
        rangeStart: DateTime
        rangeEnd: DateTime
        endAt: DateTime
      }
    }
  | { ok: false; status: number; error: string }

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function toDateTimeEnd(raw: string): DateTime | null {
  const txt = String(raw || '').trim()
  if (!txt) return null
  const hasTime = txt.includes('T') || txt.includes(' ')
  const dt = DateTime.fromISO(txt)
  if (!dt.isValid) return null
  return hasTime ? dt : dt.endOf('day')
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v))
  if (!value) return []
  try {
    const parsed = JSON.parse(String(value))
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : []
  } catch {
    return []
  }
}

async function computeCut(
  request: HttpContext['request'],
  restaurantId: number
): Promise<ComputeResult> {
  const initialCountId = Number(request.input('initialCountId') || 0)
  if (!initialCountId) {
    return { ok: false, status: 400, error: 'initial_count_required' }
  }

  const finalCountIdRaw = request.input('finalCountId')
  const finalCountId = finalCountIdRaw ? Number(finalCountIdRaw) : null

  const endDateRaw = request.input('endDate')
  const movementTypesRaw = request.input('movementTypes')
  const itemIdsRaw = request.input('itemIds')
  const warehouseIdRaw = request.input('warehouseId')

  const movementTypes =
    Array.isArray(movementTypesRaw) && movementTypesRaw.length
      ? movementTypesRaw.map((t) => String(t).trim()).filter(Boolean)
      : ['purchase', 'sale_consumption', 'manual_adjustment', 'waste']

  const itemIds = Array.isArray(itemIdsRaw)
    ? itemIdsRaw.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    : []

  const initialCount = await StockCount.query()
    .where('restaurantId', restaurantId)
    .where('id', initialCountId)
    .where('status', 'closed')
    .whereNull('deletedAt')
    .first()

  if (!initialCount) {
    return { ok: false, status: 400, error: 'initial_count_not_found' }
  }

  const warehouseId = Number(initialCount.warehouseId)
  if (warehouseIdRaw && Number(warehouseIdRaw) !== warehouseId) {
    return { ok: false, status: 400, error: 'warehouse_mismatch' }
  }

  const initialFinished = initialCount.finishedAt ?? initialCount.startedAt
  if (!initialFinished) {
    return { ok: false, status: 400, error: 'initial_count_missing_finished_at' }
  }

  let finalCount: StockCount | null = null
  let endAt: DateTime | null = null

  if (finalCountId) {
    finalCount = await StockCount.query()
      .where('restaurantId', restaurantId)
      .where('id', finalCountId)
      .where('status', 'closed')
      .whereNull('deletedAt')
      .first()

    if (!finalCount) {
      return { ok: false, status: 400, error: 'final_count_not_found' }
    }

    if (Number(finalCount.warehouseId) !== warehouseId) {
      return { ok: false, status: 400, error: 'final_count_warehouse_mismatch' }
    }

    const finalFinished = finalCount.finishedAt ?? finalCount.startedAt
    if (!finalFinished) {
      return { ok: false, status: 400, error: 'final_count_missing_finished_at' }
    }

    endAt = finalFinished
  } else {
    endAt = toDateTimeEnd(String(endDateRaw || ''))
    if (!endAt) {
      return { ok: false, status: 400, error: 'end_date_required' }
    }
  }

  const startAt = DateTime.fromJSDate(initialFinished.toJSDate())
  const movementStart = startAt.plus({ seconds: 1 })
  const movementEnd = DateTime.fromJSDate(endAt.toJSDate())

  if (movementEnd.toMillis() <= movementStart.toMillis()) {
    return { ok: false, status: 400, error: 'invalid_date_range' }
  }

  const initialItemsQuery = db
    .from('stock_count_items')
    .select('inventory_item_id', 'counted_qty_base', 'unit_cost_at_count')
    .where('stock_count_id', initialCountId)

  if (itemIds.length) {
    initialItemsQuery.whereIn('inventory_item_id', itemIds)
  }

  const initialItems = await initialItemsQuery

  const finalItemsQuery = finalCountId
    ? db
        .from('stock_count_items')
        .select('inventory_item_id', 'counted_qty_base', 'unit_cost_at_count')
        .where('stock_count_id', finalCountId)
    : null

  if (finalItemsQuery && itemIds.length) {
    finalItemsQuery.whereIn('inventory_item_id', itemIds)
  }

  const finalItems = finalItemsQuery ? await finalItemsQuery : []

  const excludeCountIds = [initialCountId]
  if (finalCountId) excludeCountIds.push(finalCountId)

  const movementQuery = db
    .from('inventory_movements')
    .select('inventory_item_id')
    .where('restaurant_id', restaurantId)
    .where('warehouse_id', warehouseId)
    .whereIn('movement_type', movementTypes)
    .where('movement_at', '>=', movementStart.toJSDate())
    .where('movement_at', '<=', movementEnd.toJSDate())

  if (itemIds.length) {
    movementQuery.whereIn('inventory_item_id', itemIds)
  }

  if (excludeCountIds.length) {
    movementQuery.whereNot((q) => {
      q.where('reference_type', 'stock_count').whereIn('reference_id', excludeCountIds)
    })
  }

  const movementRows = await movementQuery
    .sum('quantity_base as movement_qty_base')
    .sum(db.raw('ABS(COALESCE(total_cost, 0)) as movement_cost_total'))
    .sum(
      db.raw(
        'CASE WHEN total_cost IS NOT NULL THEN ABS(quantity_base) ELSE 0 END as movement_cost_qty'
      )
    )
    .groupBy('inventory_item_id')

  const initialMap = new Map<number, { qty: number; unitCost: number | null }>()
  for (const row of initialItems as any[]) {
    const id = Number(row.inventory_item_id)
    initialMap.set(id, {
      qty: toNumber(row.counted_qty_base),
      unitCost:
        row.unit_cost_at_count === null || row.unit_cost_at_count === undefined
          ? null
          : Number(row.unit_cost_at_count),
    })
  }

  const finalMap = new Map<number, { qty: number; unitCost: number | null }>()
  for (const row of finalItems as any[]) {
    const id = Number(row.inventory_item_id)
    finalMap.set(id, {
      qty: toNumber(row.counted_qty_base),
      unitCost:
        row.unit_cost_at_count === null || row.unit_cost_at_count === undefined
          ? null
          : Number(row.unit_cost_at_count),
    })
  }

  const movementMap = new Map<number, { qty: number; costTotal: number; costQty: number }>()
  for (const row of movementRows as any[]) {
    const id = Number(row.inventory_item_id)
    movementMap.set(id, {
      qty: toNumber(row.movement_qty_base),
      costTotal: toNumber(row.movement_cost_total),
      costQty: toNumber(row.movement_cost_qty),
    })
  }

  const itemIdSet = new Set<number>()
  if (itemIds.length) {
    for (const id of itemIds) itemIdSet.add(id)
  } else {
    for (const id of initialMap.keys()) itemIdSet.add(id)
    for (const id of finalMap.keys()) itemIdSet.add(id)
    for (const id of movementMap.keys()) itemIdSet.add(id)
  }

  const itemIdsList = Array.from(itemIdSet.values())
  if (!itemIdsList.length) {
    return {
      ok: true,
      data: {
        ok: true,
        range: { start: movementStart.toISO(), end: movementEnd.toISO() },
        warehouseId,
        initialCount: { id: initialCountId, finishedAt: initialFinished.toISO() },
        finalCount: finalCount
          ? { id: finalCount.id, finishedAt: finalCount.finishedAt?.toISO() }
          : null,
        movementTypes,
        totals: {
          initialQtyBase: 0,
          movementQtyBase: 0,
          theoreticalQtyBase: 0,
          finalQtyBase: finalCount ? 0 : null,
          diffQtyBase: finalCount ? 0 : null,
          diffCost: finalCount ? 0 : null,
        },
        rows: [],
      },
      meta: {
        compareMode: finalCount ? 'count' : 'theoretical',
        itemScope: itemIds.length ? 'selected' : 'all',
        itemIds,
        movementTypes,
        initialCountId,
        finalCountId,
        warehouseId,
        rangeStart: movementStart,
        rangeEnd: movementEnd,
        endAt: movementEnd,
      },
    }
  }

  const itemRows = await db
    .from('inventory_items as ii')
    .leftJoin('measurement_units as mu', 'mu.id', 'ii.unit_id')
    .select('ii.id', 'ii.code', 'ii.name', 'mu.code as unitCode')
    .whereIn('ii.id', itemIdsList)

  const itemInfoMap = new Map<
    number,
    { code: string | null; name: string | null; unitCode: string | null }
  >()
  for (const row of itemRows as any[]) {
    itemInfoMap.set(Number(row.id), {
      code: row.code ?? null,
      name: row.name ?? null,
      unitCode: row.unitCode ?? null,
    })
  }

  const rows: CutRow[] = []
  let totalInitial = 0
  let totalMovement = 0
  let totalTheoretical = 0
  let totalFinal = 0
  let totalDiff = 0
  let totalDiffCost = 0

  for (const id of itemIdsList) {
    const info = itemInfoMap.get(id) || { code: null, name: null, unitCode: null }
    const initial = initialMap.get(id)
    const final = finalMap.get(id)
    const movement = movementMap.get(id)

    const initialQty = initial ? initial.qty : 0
    const movementQty = movement ? movement.qty : 0
    const theoreticalQty = initialQty + movementQty

    const finalQty = final ? final.qty : finalCount ? 0 : null
    const diffQty = finalQty !== null ? finalQty - theoreticalQty : null

    const unitCost =
      initial?.unitCost ??
      final?.unitCost ??
      (movement && movement.costQty ? movement.costTotal / movement.costQty : null)

    const diffCost = diffQty !== null && unitCost !== null ? diffQty * unitCost : null

    totalInitial += initialQty
    totalMovement += movementQty
    totalTheoretical += theoreticalQty
    if (finalQty !== null) totalFinal += finalQty
    if (diffQty !== null) totalDiff += diffQty
    if (diffCost !== null) totalDiffCost += diffCost

    rows.push({
      inventoryItemId: id,
      code: info.code,
      name: info.name,
      unitCode: info.unitCode,
      initialQtyBase: initialQty,
      movementQtyBase: movementQty,
      theoreticalQtyBase: theoreticalQty,
      finalQtyBase: finalQty,
      diffQtyBase: diffQty,
      unitCost: unitCost,
      diffCost: diffCost,
    })
  }

  return {
    ok: true,
    data: {
      ok: true,
      range: { start: movementStart.toISO(), end: movementEnd.toISO() },
      warehouseId,
      initialCount: { id: initialCountId, finishedAt: initialFinished.toISO() },
      finalCount: finalCount
        ? { id: finalCount.id, finishedAt: finalCount.finishedAt?.toISO() }
        : null,
      movementTypes,
      totals: {
        initialQtyBase: totalInitial,
        movementQtyBase: totalMovement,
        theoreticalQtyBase: totalTheoretical,
        finalQtyBase: finalCount ? totalFinal : null,
        diffQtyBase: finalCount ? totalDiff : null,
        diffCost: finalCount ? totalDiffCost : null,
      },
      rows,
    },
    meta: {
      compareMode: finalCount ? 'count' : 'theoretical',
      itemScope: itemIds.length ? 'selected' : 'all',
      itemIds,
      movementTypes,
      initialCountId,
      finalCountId,
      warehouseId,
      rangeStart: movementStart,
      rangeEnd: movementEnd,
      endAt: movementEnd,
    },
  }
}

export default class InventoryCutsController {
  public async calc({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const result = await computeCut(request, restaurantId)
    if (!result.ok) {
      return response.status(result.status).send({ error: result.error })
    }
    return response.ok(result.data)
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const result = await computeCut(request, restaurantId)
    if (!result.ok) {
      return response.status(result.status).send({ error: result.error })
    }

    const movementTypesJson = JSON.stringify(result.meta.movementTypes || [])
    const itemIdsJson = result.meta.itemIds.length ? JSON.stringify(result.meta.itemIds) : null

    const cutId = await db.transaction(async (trx) => {
      const insertRows = await db
        .from('inventory_cuts')
        .useTransaction(trx)
        .insert({
          restaurant_id: restaurantId,
          warehouse_id: result.meta.warehouseId,
          initial_count_id: result.meta.initialCountId,
          final_count_id: result.meta.finalCountId,
          compare_mode: result.meta.compareMode,
          range_start: result.meta.rangeStart.toJSDate(),
          range_end: result.meta.rangeEnd.toJSDate(),
          end_at: result.meta.endAt.toJSDate(),
          movement_types: movementTypesJson,
          item_scope: result.meta.itemScope,
          item_ids_json: itemIdsJson,
          initial_qty_base: result.data.totals.initialQtyBase,
          movement_qty_base: result.data.totals.movementQtyBase,
          theoretical_qty_base: result.data.totals.theoreticalQtyBase,
          final_qty_base: result.data.totals.finalQtyBase,
          diff_qty_base: result.data.totals.diffQtyBase,
          diff_cost: result.data.totals.diffCost,
        })
        .returning('id')

      const rawId = Array.isArray(insertRows) ? insertRows[0] : insertRows
      const id = typeof rawId === 'number' ? rawId : Number(rawId?.id)

      if (result.data.rows.length) {
        const items = result.data.rows.map((row) => ({
          inventory_cut_id: id,
          inventory_item_id: row.inventoryItemId,
          initial_qty_base: row.initialQtyBase,
          movement_qty_base: row.movementQtyBase,
          theoretical_qty_base: row.theoreticalQtyBase,
          final_qty_base: row.finalQtyBase,
          diff_qty_base: row.diffQtyBase,
          unit_cost: row.unitCost,
          diff_cost: row.diffCost,
        }))

        await db.table('inventory_cut_items').useTransaction(trx).insert(items)
      }

      return id
    })

    return response.created({ cutId, ...result.data })
  }

  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const warehouseId = request.input('warehouseId')

    const q = db
      .from('inventory_cuts as ic')
      .leftJoin('stock_counts as sci', 'sci.id', 'ic.initial_count_id')
      .leftJoin('stock_counts as scf', 'scf.id', 'ic.final_count_id')
      .select([
        'ic.id',
        'ic.compare_mode as compareMode',
        'ic.range_start as rangeStart',
        'ic.range_end as rangeEnd',
        'ic.end_at as endAt',
        'ic.movement_types as movementTypes',
        'ic.item_scope as itemScope',
        'ic.initial_count_id as initialCountId',
        'ic.final_count_id as finalCountId',
        'ic.initial_qty_base as initialQtyBase',
        'ic.movement_qty_base as movementQtyBase',
        'ic.theoretical_qty_base as theoreticalQtyBase',
        'ic.final_qty_base as finalQtyBase',
        'ic.diff_qty_base as diffQtyBase',
        'ic.diff_cost as diffCost',
        'ic.created_at as createdAt',
        'sci.notes as initialCountName',
        'sci.finished_at as initialCountFinishedAt',
        'sci.started_at as initialCountStartedAt',
        'scf.notes as finalCountName',
        'scf.finished_at as finalCountFinishedAt',
        'scf.started_at as finalCountStartedAt',
      ])
      .where('ic.restaurant_id', restaurantId)

    if (warehouseId) {
      q.where('ic.warehouse_id', Number(warehouseId))
    }

    const rows = await q.orderBy('ic.id', 'desc')

    return rows.map((row: any) => ({
      id: Number(row.id),
      compareMode: row.compareMode || 'theoretical',
      rangeStart: row.rangeStart,
      rangeEnd: row.rangeEnd,
      endAt: row.endAt,
      movementTypes: parseJsonArray(row.movementTypes),
      itemScope: row.itemScope || 'all',
      initialCountId: Number(row.initialCountId || 0),
      finalCountId: row.finalCountId ? Number(row.finalCountId) : null,
      initialCountName: row.initialCountName ?? null,
      initialCountFinishedAt: row.initialCountFinishedAt ?? row.initialCountStartedAt ?? null,
      finalCountName: row.finalCountName ?? null,
      finalCountFinishedAt: row.finalCountFinishedAt ?? row.finalCountStartedAt ?? null,
      totals: {
        initialQtyBase: toNumber(row.initialQtyBase),
        movementQtyBase: toNumber(row.movementQtyBase),
        theoreticalQtyBase: toNumber(row.theoreticalQtyBase),
        finalQtyBase: row.finalQtyBase === null ? null : toNumber(row.finalQtyBase),
        diffQtyBase: row.diffQtyBase === null ? null : toNumber(row.diffQtyBase),
        diffCost: row.diffCost === null ? null : toNumber(row.diffCost),
      },
      createdAt: row.createdAt,
    }))
  }
}
