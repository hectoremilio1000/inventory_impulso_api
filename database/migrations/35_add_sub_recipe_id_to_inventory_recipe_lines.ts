import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_recipe_lines'

  public async up() {
    this.schema.alterTable(this.tableName, (t) => {
      t
        .integer('sub_recipe_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('inventory_recipes')
        .onDelete('RESTRICT')
        .after('inventory_item_id')

      t.integer('inventory_item_id').nullable().alter()
    })

    this.schema.raw(`
      DROP INDEX IF EXISTS inventory_recipe_lines_uq;
      CREATE UNIQUE INDEX inventory_recipe_lines_item_uq
      ON inventory_recipe_lines (recipe_id, inventory_item_id)
      WHERE inventory_item_id IS NOT NULL;
      CREATE UNIQUE INDEX inventory_recipe_lines_sub_recipe_uq
      ON inventory_recipe_lines (recipe_id, sub_recipe_id)
      WHERE sub_recipe_id IS NOT NULL;
      ALTER TABLE inventory_recipe_lines
      ADD CONSTRAINT inventory_recipe_lines_item_or_sub
      CHECK ((inventory_item_id IS NOT NULL) <> (sub_recipe_id IS NOT NULL));
    `)
  }

  public async down() {
    this.schema.raw(`
      ALTER TABLE inventory_recipe_lines DROP CONSTRAINT IF EXISTS inventory_recipe_lines_item_or_sub;
      DROP INDEX IF EXISTS inventory_recipe_lines_item_uq;
      DROP INDEX IF EXISTS inventory_recipe_lines_sub_recipe_uq;
    `)

    this.schema.alterTable(this.tableName, (t) => {
      t.integer('inventory_item_id').notNullable().alter()
      t.dropColumn('sub_recipe_id')
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX inventory_recipe_lines_uq
      ON inventory_recipe_lines (recipe_id, inventory_item_id);
    `)
  }
}
