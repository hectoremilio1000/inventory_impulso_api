// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/20_create_stock_count_items_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_count_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('stock_count_id').unsigned().notNullable()
      table.foreign('stock_count_id').references('id').inTable('stock_counts').onDelete('CASCADE')

      table.integer('inventory_item_id').unsigned().notNullable()
      table
        .foreign('inventory_item_id')
        .references('id')
        .inTable('inventory_items')
        .onDelete('RESTRICT')

      table.integer('presentation_id').unsigned().nullable()
      table
        .foreign('presentation_id')
        .references('id')
        .inTable('inventory_presentations')
        .onDelete('SET NULL')

      table.decimal('theoretical_qty_base', 14, 4).notNullable()
      table.decimal('counted_qty_base', 14, 4).notNullable()
      table.decimal('difference_qty_base', 14, 4).notNullable()

      table.decimal('unit_cost_at_count', 14, 6).nullable()
      table.decimal('difference_total_cost', 14, 4).nullable()

      table.string('notes', 255).nullable()

      table.timestamps(true, true)

      table.unique(['stock_count_id', 'inventory_item_id'])
      table.index(['stock_count_id'], 'idx_sci_count')
      table.index(['inventory_item_id'], 'idx_sci_item')
      table.index(['presentation_id'], 'idx_sci_presentation')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
