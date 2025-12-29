import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PurchaseOrder from '#models/purchase_order'
import InventoryPresentation from '#models/inventory_presentation'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class PurchaseOrderItem extends BaseModel {
  public static table = 'purchase_order_items'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'purchase_order_id' })
  declare purchaseOrderId: number

  @belongsTo(() => PurchaseOrder, { foreignKey: 'purchaseOrderId' })
  declare purchaseOrder: BelongsTo<typeof PurchaseOrder>

  @column({ columnName: 'presentation_id' })
  declare presentationId: number

  @belongsTo(() => InventoryPresentation, { foreignKey: 'presentationId' })
  declare presentation: BelongsTo<typeof InventoryPresentation>

  @column({ ...dec })
  declare quantity: number

  @column({ columnName: 'unit_price', ...dec })
  declare unitPrice: number

  @column({ columnName: 'discount_amount', ...dec })
  declare discountAmount: number

  @column({ columnName: 'tax_rate', ...dec })
  declare taxRate: number | null

  @column({ columnName: 'tax_amount', ...dec })
  declare taxAmount: number

  @column({ columnName: 'line_subtotal', ...dec })
  declare lineSubtotal: number

  @column({ columnName: 'line_total', ...dec })
  declare lineTotal: number

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
