import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import StockCount from '#models/stock_count'
import InventoryItem from '#models/inventory_item'
import InventoryPresentation from '#models/inventory_presentation'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class StockCountItem extends BaseModel {
  static table = 'stock_count_items'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'stock_count_id' })
  declare stockCountId: number

  @column({ columnName: 'inventory_item_id' })
  declare inventoryItemId: number

  @column({ columnName: 'presentation_id' })
  declare presentationId: number | null

  @column({ columnName: 'theoretical_qty_base', ...dec })
  declare theoreticalQtyBase: number

  @column({ columnName: 'counted_qty_base', ...dec })
  declare countedQtyBase: number

  @column({ columnName: 'difference_qty_base', ...dec })
  declare differenceQtyBase: number

  @column({ columnName: 'unit_cost_at_count', ...dec })
  declare unitCostAtCount: number | null

  @column({ columnName: 'difference_total_cost', ...dec })
  declare differenceTotalCost: number | null

  @column()
  declare notes: string | null

  @belongsTo(() => StockCount, { foreignKey: 'stockCountId' })
  declare stockCount: BelongsTo<typeof StockCount>

  @belongsTo(() => InventoryItem, { foreignKey: 'inventoryItemId' })
  declare item: BelongsTo<typeof InventoryItem>

  @belongsTo(() => InventoryPresentation, { foreignKey: 'presentationId' })
  declare presentation: BelongsTo<typeof InventoryPresentation>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
