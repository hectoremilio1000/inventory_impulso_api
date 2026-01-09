import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import InventoryWarehouse from '#models/inventory_warehouse'

export default class WarehouseLocation extends BaseModel {
  public static table = 'warehouse_locations'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'warehouse_id' })
  declare warehouseId: number

  @belongsTo(() => InventoryWarehouse, { foreignKey: 'warehouseId' })
  declare warehouse: BelongsTo<typeof InventoryWarehouse>

  @column()
  declare name: string

  @column({ columnName: 'parent_id' })
  declare parentId: number | null

  @belongsTo(() => WarehouseLocation, { foreignKey: 'parentId' })
  declare parent?: BelongsTo<typeof WarehouseLocation>

  @hasMany(() => WarehouseLocation, { foreignKey: 'parentId' })
  declare children: HasMany<typeof WarehouseLocation>

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
