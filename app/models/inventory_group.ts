import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import InventoryItem from '#models/inventory_item'

export default class InventoryGroup extends BaseModel {
  public static table = 'inventory_groups'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @hasMany(() => InventoryItem, { foreignKey: 'groupId' })
  declare items: HasMany<typeof InventoryItem>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
