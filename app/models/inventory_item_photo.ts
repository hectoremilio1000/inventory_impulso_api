import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import InventoryItem from '#models/inventory_item'

export default class InventoryItemPhoto extends BaseModel {
  public static table = 'inventory_item_photos'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'inventory_item_id' })
  declare inventoryItemId: number

  @belongsTo(() => InventoryItem, { foreignKey: 'inventoryItemId' })
  declare item: BelongsTo<typeof InventoryItem>

  @column()
  declare url: string

  @column({ columnName: 'sort_order' })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
