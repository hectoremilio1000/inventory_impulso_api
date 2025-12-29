import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'

import InventoryItem from '#models/inventory_item'
import MeasurementUnit from '#models/measurement_unit'
import InventoryPresentationDetail from '#models/inventory_presentation_detail'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class InventoryPresentation extends BaseModel {
  public static table = 'inventory_presentations'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'inventory_item_id' })
  declare inventoryItemId: number

  @belongsTo(() => InventoryItem, { foreignKey: 'inventoryItemId' })
  declare item: BelongsTo<typeof InventoryItem>

  @column()
  declare code: string

  @column()
  declare name: string

  @column({ columnName: 'presentation_label' })
  declare presentationLabel: string | null

  @column({ columnName: 'presentation_unit_id' })
  declare presentationUnitId: number

  @belongsTo(() => MeasurementUnit, { foreignKey: 'presentationUnitId' })
  declare presentationUnit: BelongsTo<typeof MeasurementUnit>

  @column({ columnName: 'content_in_base_unit', ...dec })
  declare contentInBaseUnit: number

  @column({ columnName: 'is_default_purchase' })
  declare isDefaultPurchase: boolean

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @hasOne(() => InventoryPresentationDetail, { foreignKey: 'presentationId' })
  declare detail: HasOne<typeof InventoryPresentationDetail>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
