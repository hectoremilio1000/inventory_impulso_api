import type { HttpContext } from '@adonisjs/core/http'
import InventoryRecipe from '#models/inventory_recipe'
import InventoryRecipeLine from '#models/inventory_recipe_line'
import InventoryItem from '#models/inventory_item'
import { getRestaurantId } from '#utils/restaurant'

function serializeRecipe(row: InventoryRecipe) {
  const data = row.serialize()
  return {
    ...data,
    name: data.name ?? data.posProductCode ?? `POS-${data.posProductId}`,
  }
}

export default class InventoryRecipesController {
  // GET /api/inventory/recipes?q=&posProductId=
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()
    const posProductId = request.input('posProductId')

    const query = InventoryRecipe.query().where('restaurantId', restaurantId).orderBy('id', 'desc')

    if (posProductId) query.where('posProductId', Number(posProductId))
    if (q) query.where((b) => b.whereILike('posProductCode', `%${q}%`).orWhereILike('name', `%${q}%`))

    const rows = await query
    return rows.map(serializeRecipe)
  }

  // GET /api/inventory/recipes/:id  (incluye lines)
  public async show({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const row = await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('id', Number(params.id))
      .preload('lines', (lq) => lq.preload('item', (iq) => iq.preload('unit').preload('group')))
      .firstOrFail()

    return serializeRecipe(row)
  }

  // POST /api/inventory/recipes
  // body: { posProductId, name, posProductCode?, isActive? }
  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const posProductId = Number(request.input('posProductId') || 0)
    const name = String(request.input('name') ?? '').trim()
    const posProductCode = request.input('posProductCode')
      ? String(request.input('posProductCode'))
      : null
    const isActive =
      request.input('isActive') !== undefined ? Boolean(request.input('isActive')) : true

    if (!posProductId) {
      return response.badRequest({ error: 'posProductId requerido' })
    }
    if (!name) {
      return response.badRequest({ error: 'name requerido' })
    }

    const row = await InventoryRecipe.updateOrCreate(
      { restaurantId, posProductId },
      { restaurantId, posProductId, posProductCode, name, isActive }
    )

    return response.created(row)
  }

  // PUT /api/inventory/recipes/:id
  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)

    const row = await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
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

    await row.delete()
    return response.noContent()
  }

  // POST /api/inventory/recipes/:id/lines  (agrega o actualiza una línea)
  // body: { inventoryItemId, qtyBase, wastePercent? }
  public async upsertLine({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const recipeId = Number(params.id)

    // valida recipe del restaurante
    const recipe = await InventoryRecipe.query()
      .where('restaurantId', restaurantId)
      .where('id', recipeId)
      .firstOrFail()

    const inventoryItemId = Number(request.input('inventoryItemId') || 0)
    const qtyBase = Number(request.input('qtyBase') || 0)
    const wastePercentRaw = request.input('wastePercent')
    const wastePercent =
      wastePercentRaw === null || wastePercentRaw === undefined ? null : Number(wastePercentRaw)

    if (!inventoryItemId || !(qtyBase > 0)) {
      return response.badRequest({ error: 'inventoryItemId y qtyBase (>0) requeridos' })
    }

    // valida item del restaurante
    await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('id', inventoryItemId)
      .firstOrFail()

    const line = await InventoryRecipeLine.updateOrCreate(
      { recipeId: recipe.id, inventoryItemId },
      { recipeId: recipe.id, inventoryItemId, qtyBase, wastePercent }
    )

    await line.load('item', (iq) => iq.preload('unit').preload('group'))
    return response.created(line)
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
