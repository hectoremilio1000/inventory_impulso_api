import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SupplierMarket from '#models/supplier_market'
import Supplier from '#models/supplier'

export default class SupplierMarketSupplier extends BaseModel {
  public static table = 'supplier_market_suppliers'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'supplier_market_id' })
  declare supplierMarketId: number

  @column({ columnName: 'supplier_id' })
  declare supplierId: number

  @belongsTo(() => SupplierMarket, { foreignKey: 'supplierMarketId' })
  declare market: BelongsTo<typeof SupplierMarket>

  @belongsTo(() => Supplier, { foreignKey: 'supplierId' })
  declare supplier: BelongsTo<typeof Supplier>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
