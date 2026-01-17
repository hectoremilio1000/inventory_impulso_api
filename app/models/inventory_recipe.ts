import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import InventoryRecipeLine from '#models/inventory_recipe_line'

export default class InventoryRecipe extends BaseModel {
  public static table = 'inventory_recipes'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'restaurant_id' })
  declare restaurantId: number

  // Bigint en DB, pero en JS lo manejamos como number (mientras tus IDs POS sean < 2^53)
  @column({ columnName: 'pos_product_id' })
  declare posProductId: number | null

  @column({ columnName: 'pos_product_code' })
  declare posProductCode: string | null

  @column()
  declare name: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @hasMany(() => InventoryRecipeLine, { foreignKey: 'recipeId' })
  declare lines: HasMany<typeof InventoryRecipeLine>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
