import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import InventoryPresentation from '#models/inventory_presentation'
import StockRequest from '#models/stock_request'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class StockRequestItem extends BaseModel {
  public static table = 'stock_request_items'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'stock_request_id' })
  declare stockRequestId: number

  @belongsTo(() => StockRequest, { foreignKey: 'stockRequestId' })
  declare stockRequest: BelongsTo<typeof StockRequest>

  @column({ columnName: 'presentation_id' })
  declare presentationId: number

  @belongsTo(() => InventoryPresentation, { foreignKey: 'presentationId' })
  declare presentation: BelongsTo<typeof InventoryPresentation>

  @column({ ...dec })
  declare quantity: number

  @column({ columnName: 'fulfilled_qty', ...dec })
  declare fulfilledQty: number | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
