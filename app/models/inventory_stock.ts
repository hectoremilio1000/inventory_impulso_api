import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import InventoryWarehouse from '#models/inventory_warehouse'
import InventoryItem from '#models/inventory_item'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class InventoryStock extends BaseModel {
  static table = 'inventory_stocks'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'warehouse_id' })
  declare warehouseId: number

  @column({ columnName: 'inventory_item_id' })
  declare inventoryItemId: number

  @column({ columnName: 'qty_on_hand_base', ...dec })
  declare qtyOnHandBase: number

  @column({ columnName: 'avg_cost', ...dec })
  declare avgCost: number | null

  @column.dateTime({ columnName: 'last_movement_at' })
  declare lastMovementAt: DateTime | null

  @belongsTo(() => InventoryWarehouse, { foreignKey: 'warehouseId' })
  declare warehouse: BelongsTo<typeof InventoryWarehouse>

  @belongsTo(() => InventoryItem, { foreignKey: 'inventoryItemId' })
  declare item: BelongsTo<typeof InventoryItem>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
