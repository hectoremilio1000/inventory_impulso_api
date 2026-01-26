import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_cuts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.integer('warehouse_id').unsigned().notNullable()

      table
        .integer('initial_count_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('stock_counts')
        .onDelete('RESTRICT')

      table
        .integer('final_count_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('stock_counts')
        .onDelete('SET NULL')

      table.string('compare_mode', 20).notNullable()
      table.timestamp('range_start', { useTz: true }).notNullable()
      table.timestamp('range_end', { useTz: true }).notNullable()
      table.timestamp('end_at', { useTz: true }).nullable()

      table.string('movement_types', 1000).notNullable()
      table.string('item_scope', 20).notNullable()
      table.text('item_ids_json').nullable()

      table.decimal('initial_qty_base', 14, 4).notNullable().defaultTo(0)
      table.decimal('movement_qty_base', 14, 4).notNullable().defaultTo(0)
      table.decimal('theoretical_qty_base', 14, 4).notNullable().defaultTo(0)
      table.decimal('final_qty_base', 14, 4).nullable()
      table.decimal('diff_qty_base', 14, 4).nullable()
      table.decimal('diff_cost', 14, 4).nullable()

      table.index(['restaurant_id'], 'idx_inv_cuts_restaurant')
      table.index(['warehouse_id'], 'idx_inv_cuts_warehouse')
      table.index(['initial_count_id'], 'idx_inv_cuts_initial_count')
      table.index(['final_count_id'], 'idx_inv_cuts_final_count')
      table.index(['range_end'], 'idx_inv_cuts_range_end')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
