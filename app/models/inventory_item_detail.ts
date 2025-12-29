import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import InventoryItem from '#models/inventory_item'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class InventoryItemDetail extends BaseModel {
  public static table = 'inventory_item_details'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'inventory_item_id' })
  declare inventoryItemId: number

  @belongsTo(() => InventoryItem, { foreignKey: 'inventoryItemId' })
  declare item: BelongsTo<typeof InventoryItem>

  @column({ columnName: 'is_stockable' })
  declare isStockable: boolean

  @column({ columnName: 'last_cost', ...dec })
  declare lastCost: number | null

  @column({ columnName: 'average_cost', ...dec })
  declare averageCost: number | null

  @column({ columnName: 'tax1_rate', ...dec })
  declare tax1Rate: number | null

  @column({ columnName: 'tax2_rate', ...dec })
  declare tax2Rate: number | null

  @column({ columnName: 'tax3_rate', ...dec })
  declare tax3Rate: number | null

  @column({ columnName: 'cost_with_taxes', ...dec })
  declare costWithTaxes: number | null

  @column({ columnName: 'waste_percent', ...dec })
  declare wastePercent: number | null

  @column({ columnName: 'auto_decrement_on_use' })
  declare autoDecrementOnUse: boolean | null

  @column({ columnName: 'use_scale' })
  declare useScale: boolean | null

  @column({ columnName: 'low_stock_alert' })
  declare lowStockAlert: boolean

  @column()
  declare status: number | null

  @column({ columnName: 'standard_cost', ...dec })
  declare standardCost: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
