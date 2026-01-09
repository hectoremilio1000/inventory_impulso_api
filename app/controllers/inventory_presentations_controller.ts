import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import InventoryPresentation from '#models/inventory_presentation'
import InventoryItem from '#models/inventory_item'
import { getRestaurantId } from '#utils/restaurant'
import InventoryPresentationDetail from '#models/inventory_presentation_detail'
import WarehouseLocation from '#models/warehouse_location'

async function getUsageCountByPresentationId(ids: number[]) {
  if (!ids.length) return new Map<number, number>()

  const poRows = await db
    .from('purchase_order_items')
    .whereIn('presentation_id', ids)
    .select('presentation_id')
    .count('* as c')
    .groupBy('presentation_id')

  const scRows = await db
    .from('stock_count_items')
    .whereIn('presentation_id', ids)
    .select('presentation_id')
    .count('* as c')
    .groupBy('presentation_id')

  const map = new Map<number, number>()

  for (const r of poRows as any[]) {
    map.set(Number(r.presentation_id), Number(r.c))
  }

  for (const r of scRows as any[]) {
    const id = Number(r.presentation_id)
    const prev = map.get(id) ?? 0
    map.set(id, prev + Number(r.c))
  }

  return map
}

function slugUpper(input: string) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function nextPresentationCode(inventoryItemId: number, name: string) {
  // Base: ITEMID + slug del nombre (corto)
  const base = `P${inventoryItemId}-${slugUpper(name).slice(0, 24)}`
  const exists = await InventoryPresentation.query().where('code', base).first()
  if (!exists) return base

  // Si ya existe, agrega sufijo incremental
  for (let i = 2; i < 1000; i++) {
    const code = `${base}-${i}`
    const exists2 = await InventoryPresentation.query().where('code', code).first()
    if (!exists2) return code
  }
  return `${base}-${Date.now()}`
}

export default class InventoryPresentationsController {
  // GET /api/inventory/items/:itemId/presentations
  public async index({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', params.itemId)
      .firstOrFail()

    const rows = await InventoryPresentation.query()
      .where('inventoryItemId', params.itemId)
      .preload('presentationUnit')
      .preload('detail', (q) => q.preload('supplier'))
      .orderBy('name', 'asc')

    const ids = rows.map((r) => r.id)
    const usageMap = await getUsageCountByPresentationId(ids)

    // ✅ anexamos flags para el front
    return rows.map((r) => ({
      ...r.serialize(),
      usageCount: usageMap.get(r.id) ?? 0,
      canDelete: (usageMap.get(r.id) ?? 0) === 0,
    }))
  }

  // GET /api/inventory/presentations/search?restaurantId=1&q=coca
  public async search({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.qs().q ?? '').trim()
    const limit = Number(request.input('limit', 20)) || 20

    const supplierId = Number(request.input('supplierId') || 0)

    const query = InventoryPresentation.query()
      .join('inventory_items', 'inventory_items.id', 'inventory_presentations.inventory_item_id')
      .where('inventory_items.restaurant_id', restaurantId)
      .select('inventory_presentations.*')
      .preload('presentationUnit')
      .preload('detail', (d) => d.preload('supplier'))
      .preload('item', (itemQ) => itemQ.preload('unit').preload('group'))
      .orderBy('inventory_presentations.name', 'asc')
      .limit(limit)

    // ✅ filtro por proveedor (default o alterno)
    if (supplierId) {
      query.where((b) => {
        b.whereExists((sub) => {
          sub
            .from('inventory_presentation_details as pd')
            .whereRaw('pd.presentation_id = inventory_presentations.id')
            .where('pd.supplier_id', supplierId)
        }).orWhereExists((sub) => {
          sub
            .from('inventory_presentation_supplier_costs as ipc')
            .whereRaw('ipc.presentation_id = inventory_presentations.id')
            .where('ipc.restaurant_id', restaurantId)
            .where('ipc.supplier_id', supplierId)
        })
      })
    }

    if (q) {
      query.where((b) =>
        b
          .whereILike('inventory_presentations.code', `%${q}%`)
          .orWhereILike('inventory_presentations.name', `%${q}%`)
          .orWhereILike('inventory_items.code', `%${q}%`)
          .orWhereILike('inventory_items.name', `%${q}%`)
      )
    }

    const rows = await query
    const ids = rows.map((r) => r.id)
    const usageMap = await getUsageCountByPresentationId(ids)

    return rows.map((r) => ({
      ...r.serialize(),
      usageCount: usageMap.get(r.id) ?? 0,
      canDelete: (usageMap.get(r.id) ?? 0) === 0,
    }))
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only([
      'inventoryItemId',
      'code',
      'name',
      'presentationLabel',
      'presentationUnitId',
      'contentInBaseUnit',
      'isDefaultPurchase',
      'isActive',
    ])

    await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', payload.inventoryItemId)
      .firstOrFail()

    // ✅ si no mandan code, lo generamos
    if (!payload.code) {
      payload.code = await nextPresentationCode(payload.inventoryItemId, payload.name)
    } else {
      payload.code = slugUpper(payload.code)
    }

    // ✅ si viene como default, desmarca las demás del mismo item
    if (payload.isDefaultPurchase) {
      await InventoryPresentation.query()
        .where('inventoryItemId', payload.inventoryItemId)
        .update({ isDefaultPurchase: false })
    }

    const row = await InventoryPresentation.create(payload)
    await row.load('presentationUnit')
    await row.load('detail', (q) => q.preload('supplier'))

    return response.created({
      ...row.serialize(),
      usageCount: 0,
      canDelete: true,
    })
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    // 🔒 scoping por restaurante
    const row = await InventoryPresentation.query()
      .join('inventory_items', 'inventory_items.id', 'inventory_presentations.inventory_item_id')
      .where('inventory_presentations.id', Number(params.id))
      .where('inventory_items.restaurant_id', restaurantId)
      .select('inventory_presentations.*')
      .firstOrFail()

    const patch = request.only([
      'code',
      'name',
      'presentationLabel',
      'presentationUnitId',
      'contentInBaseUnit',
      'isDefaultPurchase',
      'isActive',
    ])

    if (patch.isDefaultPurchase === true) {
      await InventoryPresentation.query()
        .where('inventoryItemId', row.inventoryItemId)
        .update({ isDefaultPurchase: false })
    }

    if (patch.code) patch.code = slugUpper(patch.code)

    row.merge(patch)
    await row.save()

    await row.load('presentationUnit')
    await row.load('detail', (q) => q.preload('supplier'))

    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    // 🔒 scoping por restaurante
    const row = await InventoryPresentation.query()
      .join('inventory_items', 'inventory_items.id', 'inventory_presentations.inventory_item_id')
      .where('inventory_presentations.id', params.id)
      .where('inventory_items.restaurant_id', restaurantId)
      .select('inventory_presentations.*')
      .firstOrFail()

    // ✅ evita intentar borrar si ya se usó
    const usageMap = await getUsageCountByPresentationId([row.id])
    const usageCount = usageMap.get(row.id) ?? 0

    if (usageCount > 0) {
      return response.status(409).send({
        code: 'PRESENTATION_IN_USE',
        message: 'No se puede eliminar: esta presentación ya fue usada. Puedes desactivarla.',
        usageCount,
      })
    }

    await row.delete()
    return response.noContent()
  }
  // PUT /api/inventory/presentations/:id/detail
  public async upsertDetail({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    // 🔒 scoping por restaurante (presentation -> item -> restaurant)
    const pres = await InventoryPresentation.query()
      .join('inventory_items', 'inventory_items.id', 'inventory_presentations.inventory_item_id')
      .where('inventory_presentations.id', Number(params.id))
      .where('inventory_items.restaurant_id', restaurantId)
      .select('inventory_presentations.*')
      .firstOrFail()

    const payload = request.only([
      'supplierId',
      'tax1Rate',
      'tax2Rate',
      'tax3Rate',
      'taxIndicator',
      'status',
      'autoDecrementOnUse',
      'location',
      'locationId',
      'useScale',
      'standardCost',

      // (opcionales: si quieres permitir edición manual)
      'lastCost',
      'averageCost',
    ])

    // valida ubicación si viene locationId
    if (payload.locationId) {
      const loc = await WarehouseLocation.query()
        .where('restaurantId', restaurantId)
        .where('id', Number(payload.locationId))
        .firstOrFail()
      // sincroniza nombre como etiqueta legible (backward compat)
      payload.location = payload.location ?? loc.name
      payload.locationId = loc.id
    } else {
      payload.locationId = null
    }

    // ✅ upsert por presentationId
    let detail = await InventoryPresentationDetail.query().where('presentationId', pres.id).first()

    if (!detail) {
      detail = await InventoryPresentationDetail.create({
        presentationId: pres.id,
        ...payload,
      })
    } else {
      detail.merge(payload)
      await detail.save()
    }

    await detail.load('supplier')
    return detail
  }
}
