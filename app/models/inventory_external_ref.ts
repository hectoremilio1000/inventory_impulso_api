import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class InventoryExternalRef extends BaseModel {
  public static table = 'inventory_external_refs'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column()
  declare source: string // 'pos-order' | 'softrestaurant' | 'excel'

  @column({ columnName: 'ref_type' })
  declare refType: string // 'order_item' | 'ticket_line' | etc.

  @column({ columnName: 'ref_id' })
  declare refId: string // string para soportar A-12345, etc.

  @column()
  declare meta: any | null

  @column.dateTime({ columnName: 'applied_at' })
  declare appliedAt: DateTime

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
