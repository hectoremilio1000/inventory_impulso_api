import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PurchaseOrder from '#models/purchase_order'

export default class PurchaseRun extends BaseModel {
  public static table = 'purchase_runs'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'run_number' })
  declare runNumber: number

  @column({ columnName: 'run_code' })
  declare runCode: string

  @column()
  declare title: string | null

  @column({ columnName: 'run_at' })
  declare runAt: DateTime

  @column()
  declare status: 'draft' | 'in_progress' | 'closed' | 'cancelled' | string

  @column()
  declare notes: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @column({ columnName: 'closed_by' })
  declare closedBy: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @hasMany(() => PurchaseOrder, { foreignKey: 'purchaseRunId' })
  declare purchaseOrders: HasMany<typeof PurchaseOrder>
}
