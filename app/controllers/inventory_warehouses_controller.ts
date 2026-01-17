import type { HttpContext } from '@adonisjs/core/http'
import InventoryWarehouse from '#models/inventory_warehouse'
import { getRestaurantId } from '#utils/restaurant'

const CODE_MAX_LENGTH = 10

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
  if (!suffix) return normalizedBase.slice(0, CODE_MAX_LENGTH) || 'WH'

  const suffixPart = `-${suffix}`
  const maxBaseLen = Math.max(1, CODE_MAX_LENGTH - suffixPart.length)
  const trimmedBase = normalizedBase.slice(0, maxBaseLen) || 'W'
  return `${trimmedBase}${suffixPart}`
}

async function nextWarehouseCode(restaurantId: number, base: string) {
  const first = buildCode(base)
  const exists = await InventoryWarehouse.query()
    .where('restaurantId', restaurantId)
    .where('code', first)
    .first()
  if (!exists) return first

  for (let i = 2; i < 1000; i++) {
    const candidate = buildCode(base, i)
    const exists2 = await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('code', candidate)
      .first()
    if (!exists2) return candidate
  }

  return buildCode(base, String(Date.now()).slice(-4))
}

export default class InventoryWarehousesController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    return InventoryWarehouse.query().where('restaurantId', restaurantId).orderBy('name', 'asc')
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['code', 'name', 'description', 'kind', 'isActive'])
    const rawCode = String(payload.code ?? '').trim()
    const code = rawCode
      ? buildCode(slugUpper(rawCode))
      : await nextWarehouseCode(restaurantId, slugUpper(payload.name ?? 'WH') || 'WH')

    const row = await InventoryWarehouse.create({ ...payload, code, restaurantId })
    return response.created(row)
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()
    const patch = request.only(['code', 'name', 'description', 'kind', 'isActive'])
    if (Object.prototype.hasOwnProperty.call(patch, 'code')) {
      const cleaned = String(patch.code ?? '').trim()
      if (!cleaned) {
        delete patch.code
      } else {
        patch.code = buildCode(slugUpper(cleaned))
      }
    }
    row.merge(patch)
    await row.save()
    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await InventoryWarehouse.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()
    await row.delete()
    return response.noContent()
  }
}
