import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import InventoryPresentation from '#models/inventory_presentation'
import Supplier from '#models/supplier'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class InventoryPresentationDetail extends BaseModel {
  public static table = 'inventory_presentation_details'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'presentation_id' })
  declare presentationId: number

  @belongsTo(() => InventoryPresentation, { foreignKey: 'presentationId' })
  declare presentation: BelongsTo<typeof InventoryPresentation>

  @column({ columnName: 'last_cost', ...dec })
  declare lastCost: number | null

  @column({ columnName: 'average_cost', ...dec })
  declare averageCost: number | null

  @column({ columnName: 'supplier_id' })
  declare supplierId: number | null

  @belongsTo(() => Supplier, { foreignKey: 'supplierId' })
  declare supplier: BelongsTo<typeof Supplier>

  @column({ columnName: 'tax1_rate', ...dec })
  declare tax1Rate: number | null

  @column({ columnName: 'tax2_rate', ...dec })
  declare tax2Rate: number | null

  @column({ columnName: 'tax3_rate', ...dec })
  declare tax3Rate: number | null

  @column({ columnName: 'tax_indicator' })
  declare taxIndicator: string | null

  @column()
  declare status: number | null

  @column({ columnName: 'auto_decrement_on_use' })
  declare autoDecrementOnUse: boolean | null

  @column()
  declare location: string | null

  @column({ columnName: 'use_scale' })
  declare useScale: boolean | null

  @column({ columnName: 'standard_cost', ...dec })
  declare standardCost: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
