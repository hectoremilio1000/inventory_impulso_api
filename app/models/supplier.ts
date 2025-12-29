import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SupplierType from '#models/supplier_type'

export default class Supplier extends BaseModel {
  public static table = 'suppliers'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column({ columnName: 'tax_name' })
  declare taxName: string | null

  @column({ columnName: 'tax_id' })
  declare taxId: string | null

  @column()
  declare address: string | null

  @column({ columnName: 'postal_code' })
  declare postalCode: string | null

  @column()
  declare phone: string | null

  @column()
  declare whatsapp: string | null

  @column()
  declare email: string | null

  @column({ columnName: 'credit_days' })
  declare creditDays: number | null

  @column({ columnName: 'bank_name' })
  declare bankName: string | null

  @column({ columnName: 'bank_account' })
  declare bankAccount: string | null

  @column({ columnName: 'bank_clabe' })
  declare bankClabe: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'supplier_type_id' })
  declare supplierTypeId: number | null

  @belongsTo(() => SupplierType, { foreignKey: 'supplierTypeId' })
  declare type: BelongsTo<typeof SupplierType>

  @column({ columnName: 'auto_decrement_enabled' })
  declare autoDecrementEnabled: boolean

  @column({ columnName: 'is_default' })
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
