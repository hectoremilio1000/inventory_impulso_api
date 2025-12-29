// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/06_create_inventory_presentations_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_presentations'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('inventory_item_id').unsigned().notNullable()
      table
        .foreign('inventory_item_id')
        .references('id')
        .inTable('inventory_items')
        .onDelete('CASCADE')

      table.string('code', 30).notNullable()
      table.string('name', 150).nullable()

      table.string('presentation_label', 100).nullable()

      table.integer('presentation_unit_id').unsigned().notNullable()
      table
        .foreign('presentation_unit_id')
        .references('id')
        .inTable('measurement_units')
        .onDelete('RESTRICT')

      table.decimal('content_in_base_unit', 14, 4).nullable()

      table.boolean('is_default_purchase').nullable().defaultTo(true)
      table.boolean('is_active').nullable().defaultTo(true)

      table.unique(['inventory_item_id', 'code'])

      table.index(['inventory_item_id'], 'idx_inv_pres_item')
      table.index(['presentation_unit_id'], 'idx_inv_pres_unit')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
