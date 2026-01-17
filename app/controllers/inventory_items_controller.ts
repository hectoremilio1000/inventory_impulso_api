import type { HttpContext } from '@adonisjs/core/http'
import InventoryItem from '#models/inventory_item'
import InventoryItemDetail from '#models/inventory_item_detail'
import InventoryPresentation from '#models/inventory_presentation'
import { getRestaurantId } from '#utils/restaurant'

const IVA_RATE = 0.16
const CODE_MAX_LENGTH = 30

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

function buildCode(base: string, suffix?: string | number) {
  const normalizedBase = String(base ?? '').trim()
  if (!suffix) return normalizedBase.slice(0, CODE_MAX_LENGTH) || 'ITEM'

  const suffixPart = `-${suffix}`
  const maxBaseLen = Math.max(1, CODE_MAX_LENGTH - suffixPart.length)
  const trimmedBase = normalizedBase.slice(0, maxBaseLen) || 'I'
  return `${trimmedBase}${suffixPart}`
}

async function nextItemCode(restaurantId: number, base: string) {
  const first = buildCode(base)
  const exists = await InventoryItem.query().where('restaurantId', restaurantId).where('code', first).first()
  if (!exists) return first

  for (let i = 2; i < 1000; i++) {
    const candidate = buildCode(base, i)
    const exists2 = await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('code', candidate)
      .first()
    if (!exists2) return candidate
  }

  return buildCode(base, String(Date.now()).slice(-6))
}

function normalizeIvaRate(input: unknown) {
  if (input === true) return IVA_RATE
  if (input === false) return 0
  if (typeof input === 'string') {
    const v = input.trim().toLowerCase()
    if (v === 'true' || v === 'si') return IVA_RATE
    if (v === 'false' || v === 'no') return 0
  }
  return input
}

export default class InventoryItemsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()
    const groupId = request.input('groupId')
    const kind = request.input('kind')

    const includeInactive = String(request.input('includeInactive') ?? 'false') === 'true'

    const query = InventoryItem.query()
      .where('restaurantId', restaurantId)
      .preload('group')
      .preload('unit')
      .preload('photos')
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')

    if (q) {
      query.whereILike('code', `%${q}%`).orWhereILike('name', `%${q}%`)
    }
    if (groupId) query.where('groupId', Number(groupId))
    if (kind) query.where('kind', String(kind))
    if (!includeInactive) query.where('isActive', true)

    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['code', 'name', 'description', 'groupId', 'unitId', 'kind'])

    const baseCode = payload.code ? String(payload.code).trim() : slugUpper(payload.name ?? 'ITEM')
    const code = await nextItemCode(restaurantId, baseCode || 'ITEM')

    const item = await InventoryItem.create({ ...payload, code, restaurantId })

    // detalle 1:1 (si lo quieres crear siempre)
    await InventoryItemDetail.firstOrCreate(
      { inventoryItemId: item.id },
      { inventoryItemId: item.id, isStockable: true }
    )

    await item.load('group')
    await item.load('unit')
    await item.load('detail')

    return response.created(item)
  }

  public async show({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    return InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .preload('group')
      .preload('unit')
      .preload('detail')
      .preload('photos')
      .firstOrFail()
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const item = await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    const wasActive = item.isActive
    item.merge(request.only(['code', 'name', 'description', 'groupId', 'unitId', 'kind', 'isActive']))
    await item.save()

    if (wasActive !== false && item.isActive === false) {
      await InventoryPresentation.query().where('inventoryItemId', item.id).update({ isActive: false })
    }

    return item
  }

  public async upsertDetail({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    // asegurar que el item es del restaurante
    await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    const payload = request.only([
      'isStockable',
      'lastCost',
      'averageCost',
      'tax1Rate',
      'tax2Rate',
      'tax3Rate',
      'costWithTaxes',
      'wastePercent',
      'autoDecrementOnUse',
      'useScale',
      'lowStockAlert',
      'status',
      'standardCost',
    ])

    if ('tax1Rate' in payload) {
      payload.tax1Rate = normalizeIvaRate(payload.tax1Rate) as any
    }

    const detail = await InventoryItemDetail.updateOrCreate(
      { inventoryItemId: params.id },
      { inventoryItemId: params.id, ...payload }
    )

    return detail
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const item = await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    item.isActive = false
    await item.save()
    await InventoryPresentation.query().where('inventoryItemId', item.id).update({ isActive: false })
    return response.noContent()
  }
}
