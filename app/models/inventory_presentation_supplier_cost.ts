import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Supplier from '#models/supplier'
import InventoryPresentation from '#models/inventory_presentation'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class InventoryPresentationSupplierCost extends BaseModel {
  public static table = 'inventory_presentation_supplier_costs'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'supplier_id' })
  declare supplierId: number

  @belongsTo(() => Supplier, { foreignKey: 'supplierId' })
  declare supplier: BelongsTo<typeof Supplier>

  @column({ columnName: 'presentation_id' })
  declare presentationId: number

  @belongsTo(() => InventoryPresentation, { foreignKey: 'presentationId' })
  declare presentation: BelongsTo<typeof InventoryPresentation>

  @column({ columnName: 'last_cost', ...dec })
  declare lastCost: number | null

  @column.dateTime({ columnName: 'last_purchase_at' })
  declare lastPurchaseAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
