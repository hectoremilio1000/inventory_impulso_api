import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SupplierType extends BaseModel {
  public static table = 'supplier_types'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
