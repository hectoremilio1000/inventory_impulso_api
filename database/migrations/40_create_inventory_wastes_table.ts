import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_wastes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.index(['restaurant_id'], 'idx_inv_wastes_restaurant')

      table.integer('warehouse_id').unsigned().notNullable()
      table
        .foreign('warehouse_id')
        .references('id')
        .inTable('inventory_warehouses')
        .onDelete('RESTRICT')
      table.index(['warehouse_id'], 'idx_inv_wastes_warehouse')

      table.integer('inventory_item_id').unsigned().notNullable()
      table
        .foreign('inventory_item_id')
        .references('id')
        .inTable('inventory_items')
        .onDelete('RESTRICT')
      table.index(['inventory_item_id'], 'idx_inv_wastes_item')

      table.decimal('qty_base', 14, 4).notNullable()
      table.decimal('unit_cost', 14, 6).nullable()
      table.decimal('total_cost', 14, 4).nullable()

      table.string('reason_text', 200).notNullable()
      table.text('notes').nullable()
      table.string('status', 20).notNullable().defaultTo('pending')
      table.timestamp('reported_at', { useTz: true }).notNullable()

      table
        .integer('applied_movement_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('inventory_movements')
        .onDelete('SET NULL')

      table.index(['status'], 'idx_inv_wastes_status')
      table.index(['reported_at'], 'idx_inv_wastes_reported_at')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
