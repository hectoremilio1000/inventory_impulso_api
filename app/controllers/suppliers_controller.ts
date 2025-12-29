import type { HttpContext } from '@adonisjs/core/http'
import Supplier from '#models/supplier'
import { getRestaurantId } from '#utils/restaurant'

export default class SuppliersController {
  public async index({ request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const q = String(request.input('q') ?? '').trim()
    const isActive = request.input('isActive')

    const query = Supplier.query()
      .where('restaurantId', restaurantId)
      .preload('type')
      .orderBy('name', 'asc')

    if (q) query.where((b) => b.whereILike('code', `%${q}%`).orWhereILike('name', `%${q}%`))
    if (isActive !== undefined) query.where('isActive', String(isActive) === 'true')

    return query
  }

  public async store({ request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const payload = request.only([
      'code',
      'name',
      'taxName',
      'taxId',
      'address',
      'postalCode',
      'phone',
      'whatsapp',
      'email',
      'creditDays',
      'bankName',
      'bankAccount',
      'bankClabe',
      'isActive',
      'supplierTypeId',
      'autoDecrementEnabled',
      'isDefault',
    ])

    const row = await Supplier.create({ ...payload, restaurantId })
    return response.created(row)
  }

  public async update({ params, request }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await Supplier.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()

    row.merge(
      request.only([
        'code',
        'name',
        'taxName',
        'taxId',
        'address',
        'postalCode',
        'phone',
        'whatsapp',
        'email',
        'creditDays',
        'bankName',
        'bankAccount',
        'bankClabe',
        'isActive',
        'supplierTypeId',
        'autoDecrementEnabled',
        'isDefault',
      ])
    )
    await row.save()
    return row
  }

  public async destroy({ params, request, response }: HttpContext) {
    const restaurantId = getRestaurantId({ request } as any)
    const row = await Supplier.query()
      .where('restaurantId', restaurantId)
      .where('id', params.id)
      .firstOrFail()
    await row.delete()
    return response.noContent()
  }
}
