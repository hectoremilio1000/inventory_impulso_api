import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_recipe_lines'

  public async up() {
    this.schema.alterTable(this.tableName, (t) => {
      t
        .integer('presentation_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('inventory_presentations')
        .onDelete('RESTRICT')
        .after('inventory_item_id')

      t.index(['presentation_id'])
    })

    this.schema.raw(`
      UPDATE inventory_recipe_lines AS l
      SET presentation_id = p.id
      FROM inventory_presentations AS p
      WHERE l.inventory_item_id IS NOT NULL
        AND l.presentation_id IS NULL
        AND p.inventory_item_id = l.inventory_item_id
        AND p.is_default_purchase = true;
    `)

    this.schema.raw(`
      UPDATE inventory_recipe_lines AS l
      SET presentation_id = p.id
      FROM (
        SELECT DISTINCT ON (inventory_item_id) id, inventory_item_id
        FROM inventory_presentations
        WHERE is_active = true
        ORDER BY inventory_item_id, is_default_purchase DESC, id ASC
      ) AS p
      WHERE l.inventory_item_id IS NOT NULL
        AND l.presentation_id IS NULL
        AND p.inventory_item_id = l.inventory_item_id;
    `)
  }

  public async down() {
    this.schema.alterTable(this.tableName, (t) => {
      t.dropIndex(['presentation_id'])
      t.dropColumn('presentation_id')
    })
  }
}
