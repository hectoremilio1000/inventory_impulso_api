import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import InventoryWarehouse from '#models/inventory_warehouse'
import PurchaseRun from '#models/purchase_run'
import StockRequestItem from '#models/stock_request_item'

export default class StockRequest extends BaseModel {
  public static table = 'stock_requests'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'purchase_run_id' })
  declare purchaseRunId: number | null

  @belongsTo(() => PurchaseRun, { foreignKey: 'purchaseRunId' })
  declare purchaseRun: BelongsTo<typeof PurchaseRun>

  @column({ columnName: 'warehouse_id' })
  declare warehouseId: number

  @belongsTo(() => InventoryWarehouse, { foreignKey: 'warehouseId' })
  declare warehouse: BelongsTo<typeof InventoryWarehouse>

  @column({ columnName: 'source_warehouse_id' })
  declare sourceWarehouseId: number | null

  @belongsTo(() => InventoryWarehouse, { foreignKey: 'sourceWarehouseId' })
  declare sourceWarehouse: BelongsTo<typeof InventoryWarehouse>

  @column({ columnName: 'area_label' })
  declare areaLabel: string | null

  @column.dateTime({ columnName: 'requested_at' })
  declare requestedAt: DateTime

  @column()
  declare status: string

  @column()
  declare notes: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @hasMany(() => StockRequestItem, { foreignKey: 'stockRequestId' })
  declare items: HasMany<typeof StockRequestItem>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
