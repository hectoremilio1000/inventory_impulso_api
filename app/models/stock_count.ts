import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import InventoryWarehouse from '#models/inventory_warehouse'
import StockCountItem from '#models/stock_count_item'

export default class StockCount extends BaseModel {
  static table = 'stock_counts'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'warehouse_id' })
  declare warehouseId: number

  @column.dateTime({ columnName: 'started_at' })
  declare startedAt: DateTime

  @column.dateTime({ columnName: 'finished_at' })
  declare finishedAt: DateTime | null

  @column()
  declare status: string // in_progress | closed

  @column()
  declare notes: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @column({ columnName: 'counted_by' })
  declare countedBy: string | null

  @column({ columnName: 'closed_by' })
  declare closedBy: string | null

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @belongsTo(() => InventoryWarehouse, { foreignKey: 'warehouseId' })
  declare warehouse: BelongsTo<typeof InventoryWarehouse>

  @hasMany(() => StockCountItem, { foreignKey: 'stockCountId' })
  declare items: HasMany<typeof StockCountItem>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
