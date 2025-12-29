import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SupplierMarket from '#models/supplier_market'
import Supplier from '#models/supplier'

export default class PurchaseRoute extends BaseModel {
  public static table = 'purchase_routes'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column({ columnName: 'route_code' })
  declare routeCode: string | null

  @column({ columnName: 'supplier_market_id' })
  declare supplierMarketId: number | null

  @belongsTo(() => SupplierMarket, { foreignKey: 'supplierMarketId' })
  declare market: BelongsTo<typeof SupplierMarket>

  @column({ columnName: 'supplier_id' })
  declare supplierId: number | null

  @belongsTo(() => Supplier, { foreignKey: 'supplierId' })
  declare supplier: BelongsTo<typeof Supplier>

  @column()
  declare weekday: number

  @column({ columnName: 'start_time' })
  declare startTime: string | null

  @column({ columnName: 'end_time' })
  declare endTime: string | null

  @column()
  declare sequence: number | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
