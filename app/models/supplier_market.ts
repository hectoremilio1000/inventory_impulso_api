import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import SupplierMarketSupplier from '#models/supplier_market_supplier'

export default class SupplierMarket extends BaseModel {
  public static table = 'supplier_markets'

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

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @hasMany(() => SupplierMarketSupplier, { foreignKey: 'supplierMarketId' })
  declare marketSuppliers: HasMany<typeof SupplierMarketSupplier>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
