import type { HttpContext } from '@adonisjs/core/http'
import SupplierType from '#models/supplier_type'

export default class SupplierTypesController {
  public async index() {
    return SupplierType.query().orderBy('code', 'asc')
  }

  public async store({ request, response }: HttpContext) {
    const payload = request.only(['code', 'name', 'description'])
    const row = await SupplierType.create(payload)
    return response.created(row)
  }

  public async update({ params, request }: HttpContext) {
    const row = await SupplierType.findOrFail(params.id)
    row.merge(request.only(['code', 'name', 'description']))
    await row.save()
    return row
  }

  public async destroy({ params, response }: HttpContext) {
    const row = await SupplierType.findOrFail(params.id)
    await row.delete()
    return response.noContent()
  }
}
