import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_recipe_lines'

  public async up() {
    this.schema.createTable(this.tableName, (t) => {
      t.increments('id').primary()

      t.integer('recipe_id')
        .notNullable()
        .references('id')
        .inTable('inventory_recipes')
        .onDelete('CASCADE')

      t.integer('inventory_item_id')
        .notNullable()
        .references('id')
        .inTable('inventory_items')
        .onDelete('RESTRICT')

      t.decimal('qty_base', 14, 6).notNullable()
      t.decimal('waste_percent', 8, 6).nullable()

      t.timestamps(true, true)
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX inventory_recipe_lines_uq
      ON inventory_recipe_lines (recipe_id, inventory_item_id);
    `)
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
