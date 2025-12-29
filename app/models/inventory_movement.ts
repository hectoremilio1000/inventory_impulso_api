import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import InventoryWarehouse from '#models/inventory_warehouse'
import InventoryItem from '#models/inventory_item'
import InventoryPresentation from '#models/inventory_presentation'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class InventoryMovement extends BaseModel {
  static table = 'inventory_movements'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'warehouse_id' })
  declare warehouseId: number

  @column({ columnName: 'inventory_item_id' })
  declare inventoryItemId: number

  @column({ columnName: 'presentation_id' })
  declare presentationId: number | null

  @column({ columnName: 'movement_type' })
  declare movementType: string

  @column({ columnName: 'quantity_base', ...dec })
  declare quantityBase: number

  @column({ columnName: 'unit_cost', ...dec })
  declare unitCost: number | null

  @column({ columnName: 'total_cost', ...dec })
  declare totalCost: number | null

  @column.dateTime({ columnName: 'movement_at' })
  declare movementAt: DateTime

  @column({ columnName: 'reference_type' })
  declare referenceType: string | null

  @column({ columnName: 'reference_id' })
  declare referenceId: number | null

  @column()
  declare notes: string | null

  @belongsTo(() => InventoryWarehouse, { foreignKey: 'warehouseId' })
  declare warehouse: BelongsTo<typeof InventoryWarehouse>

  @belongsTo(() => InventoryItem, { foreignKey: 'inventoryItemId' })
  declare item: BelongsTo<typeof InventoryItem>

  @belongsTo(() => InventoryPresentation, { foreignKey: 'presentationId' })
  declare presentation: BelongsTo<typeof InventoryPresentation>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
