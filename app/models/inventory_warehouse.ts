import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PurchaseOrder from '#models/purchase_order'
import StockCount from '#models/stock_count'

export default class InventoryWarehouse extends BaseModel {
  public static table = 'inventory_warehouses'

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

  @column()
  declare kind: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @hasMany(() => PurchaseOrder, { foreignKey: 'warehouseId' })
  declare purchaseOrders: HasMany<typeof PurchaseOrder>

  @hasMany(() => StockCount, { foreignKey: 'warehouseId' })
  declare stockCounts: HasMany<typeof StockCount>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
