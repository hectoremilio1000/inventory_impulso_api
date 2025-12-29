import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import InventoryItem from '#models/inventory_item'
import InventoryPresentation from '#models/inventory_presentation'

export default class MeasurementUnit extends BaseModel {
  static table = 'measurement_units'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column({ columnName: 'sat_code' })
  declare satCode: string

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @hasMany(() => InventoryItem, { foreignKey: 'unitId' })
  declare items: HasMany<typeof InventoryItem>

  @hasMany(() => InventoryPresentation, { foreignKey: 'presentationUnitId' })
  declare presentations: HasMany<typeof InventoryPresentation>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
