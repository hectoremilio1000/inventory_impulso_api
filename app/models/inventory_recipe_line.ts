import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import InventoryRecipe from '#models/inventory_recipe'
import InventoryItem from '#models/inventory_item'
import InventoryPresentation from '#models/inventory_presentation'

const dec = {
  prepare: (v: number | null | undefined) => (v === null || v === undefined ? v : String(v)),
  consume: (v: any) => (v === null || v === undefined ? v : Number(v)),
}

export default class InventoryRecipeLine extends BaseModel {
  public static table = 'inventory_recipe_lines'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'recipe_id' })
  declare recipeId: number

  @belongsTo(() => InventoryRecipe, { foreignKey: 'recipeId' })
  declare recipe: BelongsTo<typeof InventoryRecipe>

  @column({ columnName: 'inventory_item_id' })
  declare inventoryItemId: number | null

  @belongsTo(() => InventoryItem, { foreignKey: 'inventoryItemId' })
  declare item: BelongsTo<typeof InventoryItem>

  @column({ columnName: 'presentation_id' })
  declare presentationId: number | null

  @belongsTo(() => InventoryPresentation, { foreignKey: 'presentationId' })
  declare presentation: BelongsTo<typeof InventoryPresentation>

  @column({ columnName: 'sub_recipe_id' })
  declare subRecipeId: number | null

  @belongsTo(() => InventoryRecipe, { foreignKey: 'subRecipeId' })
  declare subRecipe: BelongsTo<typeof InventoryRecipe>

  @column({ columnName: 'qty_base', ...dec })
  declare qtyBase: number

  @column({ columnName: 'waste_percent', ...dec })
  declare wastePercent: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
