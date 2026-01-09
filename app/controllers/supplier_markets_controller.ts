import type { HttpContext } from '@adonisjs/core/http'
import SupplierMarket from '#models/supplier_market'
import SupplierMarketSupplier from '#models/supplier_market_supplier'
import Supplier from '#models/supplier'
import { getRestaurantId } from '#utils/restaurant'

function slugUpper(input: string) {
  const base = String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return base || 'MARKET'
}

async function nextMarketCode(restaurantId: number, name: string) {
  const base = slugUpper(name).slice(0, 20) || 'MARKET'

  for (let i = 0; i < 500; i++) {
    const code = i === 0 ? base : `${base}-${i + 1}`
    const exists = await SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .where('code', code)
      .first()

    if (!exists) return code
  }

  return `${base}-${Date.now()}`
}

export default class SupplierMarketsController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()
    const supplierId = Number(request.input('supplierId') || 0)

    const query = SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .orderBy('name', 'asc')

    if (supplierId) {
      query
        .join('supplier_market_suppliers as sms', 'sms.supplier_market_id', 'supplier_markets.id')
        .where('sms.supplier_id', supplierId)
        .select('supplier_markets.*')
        .distinct()
    }

    if (q) query.where((b) => b.whereILike('code', `%${q}%`).orWhereILike('name', `%${q}%`))
    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only(['code', 'name', 'description', 'isActive', 'supplierId'])

    const supplierId = Number(payload.supplierId || 0) || null
    if (supplierId) {
      await Supplier.query().where('restaurantId', restaurantId).where('id', supplierId).firstOrFail()
    }

    const name = String(payload.name ?? '').trim()
    if (!name && !payload.code) {
      return response.badRequest({ error: 'name o code requerido' })
    }

    const code = payload.code ? slugUpper(payload.code) : await nextMarketCode(restaurantId, name)

    const row = await SupplierMarket.create({
      ...payload,
      code,
      name: name || code,
      isActive: payload.isActive !== false,
      restaurantId,
    })

    if (supplierId) {
      await SupplierMarketSupplier.firstOrCreate({
        supplierMarketId: row.id,
        supplierId,
      })
    }

    return response.created(row)
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    row.merge(request.only(['code', 'name', 'description', 'isActive']))
    await row.save()
    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await SupplierMarket.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
