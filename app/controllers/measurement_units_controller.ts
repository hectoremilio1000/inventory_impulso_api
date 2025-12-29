import type { HttpContext } from '@adonisjs/core/http'
import MeasurementUnit from '#models/measurement_unit'

export default class MeasurementUnitsController {
  public async index({ request }: HttpContext) {
    const q = String(request.input('q') ?? '').trim()

    const query = MeasurementUnit.query().orderBy('name', 'asc')
    if (q) {
      query.whereILike('code', `%${q}%`).orWhereILike('name', `%${q}%`)
    }

    return query
  }

  public async store({ request, response }: HttpContext) {
    const payload = request.only(['code', 'name', 'satCode', 'isActive'])
    const row = await MeasurementUnit.create(payload)
    return response.created(row)
  }

  public async show({ params }: HttpContext) {
    return MeasurementUnit.findOrFail(params.id)
  }

  public async update({ params, request }: HttpContext) {
    const row = await MeasurementUnit.findOrFail(params.id)
    row.merge(request.only(['code', 'name', 'satCode', 'isActive']))
    await row.save()
    return row
  }

  public async destroy({ params, response }: HttpContext) {
    const row = await MeasurementUnit.findOrFail(params.id)
    await row.delete()
    return response.noContent()
  }
}
