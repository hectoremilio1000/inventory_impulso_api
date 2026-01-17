import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import InventoryRecipe from '#models/inventory_recipe'
import InventoryRecipeLine from '#models/inventory_recipe_line'
import InventoryItem from '#models/inventory_item'
import InventoryPresentation from '#models/inventory_presentation'
import { getRestaurantId } from '#utils/restaurant'

function serializeRecipe(row: InventoryRecipe) {
  const data = row.serialize()
  const isInternal = data.posProductId === null || data.posProductId === undefined
  return {
    ...data,
    name: data.name ?? data.posProductCode ?? (isInternal ? 'Receta interna' : `POS-${data.posProductId}`),
    recipeType: isInternal ? 'internal' : 'pos',
  }
}

async function getDefaultSupplierLastCostMap(
  restaurantId: number,
  rows: InventoryPresentation[]
): Promise<Map<string, number | null>> {
  const pairs = rows
    .map((r) => {
      const supplierId = r.detail?.supplierId ?? r.detail?.supplier?.id ?? null
      return supplierId ? { presentationId: r.id, supplierId } : null
    })
    .filter((p): p is { presentationId: number; supplierId: number } => !!p)

  if (!pairs.length) return new Map()

  const presentationIds = Array.from(new Set(pairs.map((p) => p.presentationId)))
  const supplierIds = Array.from(new Set(pairs.map((p) => p.supplierId)))

  const rowsCost = await db
    .from('inventory_presentation_supplier_costs')
    .where('restaurant_id', restaurantId)
    .whereIn('presentation_id', presentationIds)
    .whereIn('supplier_id', supplierIds)
    .select('presentation_id', 'supplier_id', 'last_cost')

  const map = new Map<string, number | null>()
  for (const r of rowsCost as any[]) {
    const key = `${Number(r.presentation_id)}-${Number(r.supplier_id)}`
    map.set(key, r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost))
  }

  return map
}

export default class InventoryRecipesController {
  // GET /api/inventory/recipes?q=&posProductId=
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()
    const posProductId = request.input('posProductId')

    const query = InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('isActive', true)
      .withCount('lines')
      .orderBy('id', 'desc')

    if (posProductId) query.where('posProductId', Number(posProductId))
    if (q) {
      query.where((b) => {
        b.whereILike('posProductCode', `%${q}%`).orWhereILike('name', `%${q}%`)
        const asNumber = Number(q)
        if (Number.isFinite(asNumber)) {
          b.orWhere('posProductId', asNumber)
        }
      })
    }

    const rows = await query
    return rows.map((row) => ({
      ...serializeRecipe(row),
      linesCount: Number((row as any).$extras?.lines_count ?? 0),
    }))
  }

  // GET /api/inventory/recipes/:id  (incluye lines)
  public async show({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const row = await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('isActive', true)
      .where('id', Number(params.id))
      .preload('lines', (lq) =>
        lq
          .preload('item', (iq) => iq.preload('unit').preload('group'))
          .preload('subRecipe')
      )
      .firstOrFail()

    return serializeRecipe(row)
  }

  // GET /api/inventory/recipes/:id/lines
  public async lines({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const recipeId = Number(params.id)

    await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('isActive', true)
      .where('id', recipeId)
      .firstOrFail()

    const rows = await InventoryRecipeLine.query()
      .where('recipeId', recipeId)
      .preload('item', (iq) => iq.preload('unit').preload('group'))
      .preload('subRecipe')
      .preload('presentation', (pq) =>
        pq.preload('presentationUnit').preload('detail', (dq) => dq.preload('supplier'))
      )
      .orderBy('id', 'desc')

    const presentations = rows.map((r) => r.presentation).filter(Boolean) as InventoryPresentation[]
    const defaultCostMap = await getDefaultSupplierLastCostMap(restaurantId, presentations)

    return rows.map((row) => {
      const data = row.serialize()
      if (data.presentation) {
        const supplierId =
          data.presentation?.detail?.supplierId ?? data.presentation?.detail?.supplier?.id ?? null
        const key = supplierId ? `${data.presentation.id}-${supplierId}` : null
        data.presentation.defaultSupplierLastCost = key ? defaultCostMap.get(key) ?? null : null
      }
      return data
    })
  }

  // POST /api/inventory/recipes
  // body: { posProductId, name, posProductCode?, isActive? }
  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const posProductIdRaw = request.input('posProductId')
    const posProductId = posProductIdRaw ? Number(posProductIdRaw) : null
    const name = String(request.input('name') ?? '').trim()
    const posProductCode = request.input('posProductCode')
      ? String(request.input('posProductCode'))
      : null
    const isActive =
      request.input('isActive') !== undefined ? Boolean(request.input('isActive')) : true

    if (posProductIdRaw && (!posProductId || !Number.isFinite(posProductId))) {
      return response.badRequest({ error: 'posProductId inválido' })
    }
    if (!name) {
      return response.badRequest({ error: 'name requerido' })
    }

    if (posProductId) {
      const existing = await InventoryRecipe.query()
        .where('restaurantId', restaurantId)
        .where('posProductId', posProductId)
        .first()

      if (existing?.isActive) {
        return response.status(409).send({
          error: 'recipe_exists',
          recipeId: existing.id,
        })
      }

      if (existing && !existing.isActive) {
        existing.merge({
          posProductCode,
          name,
          isActive,
        })
        await existing.save()
        return response.ok(existing)
      }
    }

    const row = await InventoryRecipe.create({
      restaurantId,
      posProductId: posProductId ?? null,
      posProductCode,
      name,
      isActive,
    })

    return response.created(row)
  }

  // PUT /api/inventory/recipes/:id
  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const row = await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('isActive', true)
      .where('id', Number(params.id))
      .firstOrFail()

    row.merge({
      name: request.input('name') ?? row.name,
      posProductCode: request.input('posProductCode') ?? row.posProductCode,
      isActive:
        request.input('isActive') !== undefined ? Boolean(request.input('isActive')) : row.isActive,
    })

    await row.save()
    return serializeRecipe(row)
  }

  // DELETE /api/inventory/recipes/:id
  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const row = await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(params.id))
      .firstOrFail()

    const hasLines = await InventoryRecipeLine.query()
      .where('recipeId', row.id)
      .first()

    if (hasLines) {
      return response.status(409).send({ error: 'recipe_has_lines' })
    }

    row.isActive = false
    await row.save()
    return response.noContent()
  }

  // POST /api/inventory/recipes/:id/lines  (agrega o actualiza una línea)
  // body: { inventoryItemId, presentationId, qtyBase, wastePercent? }
  public async upsertLine({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const recipeId = Number(params.id)

    // valida recipe del restaurante
    const recipe = await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('id', recipeId)
      .firstOrFail()

    const inventoryItemIdRaw = request.input('inventoryItemId')
    const subRecipeIdRaw = request.input('subRecipeId')
    const inventoryItemId = inventoryItemIdRaw ? Number(inventoryItemIdRaw) : null
    const subRecipeId = subRecipeIdRaw ? Number(subRecipeIdRaw) : null
    const presentationIdRaw = request.input('presentationId')
    const presentationId = presentationIdRaw ? Number(presentationIdRaw) : null
    const qtyBase = Number(request.input('qtyBase') || 0)
    const wastePercentRaw = request.input('wastePercent')
    const wastePercentCompat = request.input('wastePct')
    const wastePercent =
      wastePercentRaw === null || wastePercentRaw === undefined
        ? wastePercentCompat === null || wastePercentCompat === undefined
          ? null
          : Number(wastePercentCompat)
        : Number(wastePercentRaw)

    if ((inventoryItemId && subRecipeId) || (!inventoryItemId && !subRecipeId)) {
      return response.badRequest({ error: 'Selecciona un insumo o sub-receta' })
    }
    if (!(qtyBase > 0)) {
      return response.badRequest({ error: 'qtyBase (>0) requerido' })
    }

    if (inventoryItemId) {
      // valida item del restaurante
      await InventoryItem.query()
        .where('restaurantId', restaurantId)
        .where('id', inventoryItemId)
        .firstOrFail()

      if (!presentationId || !Number.isFinite(presentationId)) {
        return response.badRequest({ error: 'presentationId requerido' })
      }

      await InventoryPresentation.query()
        .where('id', presentationId)
        .where('inventoryItemId', inventoryItemId)
        .firstOrFail()
    }

    if (subRecipeId) {
      if (subRecipeId === recipeId) {
        return response.badRequest({ error: 'Una receta no puede incluirse a sí misma' })
      }
      await InventoryRecipe.query()
        .where('restaurantId', restaurantId)
        .where('id', subRecipeId)
        .firstOrFail()
    }

    const uniqueKey = inventoryItemId
      ? { recipeId: recipe.id, inventoryItemId }
      : { recipeId: recipe.id, subRecipeId }

    const line = await InventoryRecipeLine.updateOrCreate(uniqueKey, {
      recipeId: recipe.id,
      inventoryItemId: inventoryItemId ?? null,
      subRecipeId: subRecipeId ?? null,
      presentationId: inventoryItemId ? presentationId : null,
      qtyBase,
      wastePercent,
    })

    await line.load('item', (iq) => iq.preload('unit').preload('group'))
    await line.load('subRecipe')
    await line.load('presentation', (pq) =>
      pq.preload('presentationUnit').preload('detail', (dq) => dq.preload('supplier'))
    )

    const presentations = line.presentation ? [line.presentation] : []
    const defaultCostMap = await getDefaultSupplierLastCostMap(restaurantId, presentations)
    const data = line.serialize()
    if (data.presentation) {
      const supplierId =
        data.presentation?.detail?.supplierId ?? data.presentation?.detail?.supplier?.id ?? null
      const key = supplierId ? `${data.presentation.id}-${supplierId}` : null
      data.presentation.defaultSupplierLastCost = key ? defaultCostMap.get(key) ?? null : null
    }

    return response.created(data)
  }

  // DELETE /api/inventory/recipes/:id/lines/:lineId
  public async deleteLine({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const recipeId = Number(params.id)
    const lineId = Number(params.lineId)

    // valida recipe del restaurante
    await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('id', recipeId)
      .firstOrFail()

    const line = await InventoryRecipeLine.query()
      .where('recipeId', recipeId)
      .where('id', lineId)
      .firstOrFail()

    await line.delete()
    return response.noContent()
  }
}
