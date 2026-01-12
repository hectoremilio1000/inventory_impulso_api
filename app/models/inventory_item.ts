import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'

import InventoryGroup from '#models/inventory_group'
import MeasurementUnit from '#models/measurement_unit'
import InventoryItemDetail from '#models/inventory_item_detail'
import InventoryPresentation from '#models/inventory_presentation'
import InventoryItemPhoto from '#models/inventory_item_photo'

export default class InventoryItem extends BaseModel {
  public static table = 'inventory_items'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({ columnName: 'group_id' })
  declare groupId: number | null

  @column({ columnName: 'unit_id' })
  declare unitId: number

  @column()
  declare kind: string // raw | prepared | packaging | ...

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @belongsTo(() => InventoryGroup, { foreignKey: 'groupId' })
  declare group: BelongsTo<typeof InventoryGroup>

  @belongsTo(() => MeasurementUnit, { foreignKey: 'unitId' })
  declare unit: BelongsTo<typeof MeasurementUnit>

  @hasOne(() => InventoryItemDetail, { foreignKey: 'inventoryItemId' })
  declare detail: HasOne<typeof InventoryItemDetail>

  @hasMany(() => InventoryPresentation, { foreignKey: 'inventoryItemId' })
  declare presentations: HasMany<typeof InventoryPresentation>

  @hasMany(() => InventoryItemPhoto, { foreignKey: 'inventoryItemId' })
  declare photos: HasMany<typeof InventoryItemPhoto>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
