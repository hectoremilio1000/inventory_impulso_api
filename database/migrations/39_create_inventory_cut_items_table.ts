import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_cut_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('inventory_cut_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('inventory_cuts')
        .onDelete('CASCADE')

      table
        .integer('inventory_item_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('inventory_items')
        .onDelete('RESTRICT')

      table.decimal('initial_qty_base', 14, 4).notNullable().defaultTo(0)
      table.decimal('movement_qty_base', 14, 4).notNullable().defaultTo(0)
      table.decimal('theoretical_qty_base', 14, 4).notNullable().defaultTo(0)
      table.decimal('final_qty_base', 14, 4).nullable()
      table.decimal('diff_qty_base', 14, 4).nullable()
      table.decimal('unit_cost', 14, 6).nullable()
      table.decimal('diff_cost', 14, 4).nullable()

      table.unique(['inventory_cut_id', 'inventory_item_id'], 'uq_inv_cut_item')
      table.index(['inventory_cut_id'], 'idx_inv_cut_items_cut')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
