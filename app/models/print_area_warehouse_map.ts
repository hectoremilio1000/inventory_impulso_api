import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import InventoryWarehouse from '#models/inventory_warehouse'

export default class PrintAreaWarehouseMap extends BaseModel {
  public static table = 'print_area_warehouse_maps'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'print_area_id' })
  declare printAreaId: number

  @column({ columnName: 'warehouse_id' })
  declare warehouseId: number

  @belongsTo(() => InventoryWarehouse, { foreignKey: 'warehouseId' })
  declare warehouse: BelongsTo<typeof InventoryWarehouse>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
