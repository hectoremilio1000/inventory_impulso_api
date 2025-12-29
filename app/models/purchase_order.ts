import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Supplier from '#models/supplier'
import InventoryWarehouse from '#models/inventory_warehouse'
import PurchaseOrderItem from '#models/purchase_order_item'
import PurchaseRun from '#models/purchase_run'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export type PurchaseOrderStatus = 'draft' | 'confirmed' | 'received' | 'cancelled'

export default class PurchaseOrder extends BaseModel {
  public static table = 'purchase_orders'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'supplier_id' })
  declare supplierId: number

  @belongsTo(() => Supplier, { foreignKey: 'supplierId' })
  declare supplier: BelongsTo<typeof Supplier>

  @column({ columnName: 'warehouse_id' })
  declare warehouseId: number

  @belongsTo(() => InventoryWarehouse, { foreignKey: 'warehouseId' })
  declare warehouse: BelongsTo<typeof InventoryWarehouse>

  @column({ columnName: 'document_number' })
  declare documentNumber: string | null

  @column({ columnName: 'invoice_number' })
  declare invoiceNumber: string | null

  @column({ columnName: 'order_number' })
  declare orderNumber: number

  @column.date({ columnName: 'issue_date' })
  declare issueDate: DateTime | null

  @column.date({ columnName: 'application_date' })
  declare applicationDate: DateTime | null

  @column.date({ columnName: 'due_date' })
  declare dueDate: DateTime | null

  @column.dateTime({ columnName: 'received_at' })
  declare receivedAt: DateTime | null

  @column()
  declare status: PurchaseOrderStatus

  @column({ columnName: 'discount_percent', ...dec })
  declare discountPercent: number | null

  @column({ columnName: 'discount_amount', ...dec })
  declare discountAmount: number

  @column({ ...dec })
  declare subtotal: number

  @column({ columnName: 'tax1_amount', ...dec })
  declare tax1Amount: number

  @column({ columnName: 'tax2_amount', ...dec })
  declare tax2Amount: number

  @column({ columnName: 'tax3_amount', ...dec })
  declare tax3Amount: number

  @column({ ...dec })
  declare total: number

  @column({ columnName: 'is_fiscal' })
  declare isFiscal: boolean

  @column({ columnName: 'purchase_run_id' })
  declare purchaseRunId: number | null

  @belongsTo(() => PurchaseRun, { foreignKey: 'purchaseRunId' })
  declare purchaseRun: BelongsTo<typeof PurchaseRun>

  @column({ columnName: 'withholding_isr_percent', ...dec })
  declare withholdingIsrPercent: number | null

  @column({ columnName: 'withholding_iva_percent', ...dec })
  declare withholdingIvaPercent: number | null

  @column({ columnName: 'withholding_other_percent', ...dec })
  declare withholdingOtherPercent: number | null

  @column()
  declare reference: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @column({ columnName: 'cancelled_by' })
  declare cancelledBy: string | null

  @hasMany(() => PurchaseOrderItem, { foreignKey: 'purchaseOrderId' })
  declare items: HasMany<typeof PurchaseOrderItem>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
