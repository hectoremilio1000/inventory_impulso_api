import type { HttpContext } from '@adonisjs/core/http'
import InventoryItem from '#models/inventory_item'
import InventoryItemDetail from '#models/inventory_item_detail'
import { getRestaurantId } from '#utils/restaurant'

export default class InventoryItemsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()
    const groupId = request.input('groupId')
    const kind = request.input('kind')

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

    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['code', 'name', 'description', 'groupId', 'unitId', 'kind'])

    const item = await InventoryItem.create({ ...payload, restaurantId })

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

    item.merge(request.only(['code', 'name', 'description', 'groupId', 'unitId', 'kind']))
    await item.save()

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

    await item.delete()
    return response.noContent()
  }
}
