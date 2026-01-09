import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_requests'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()

      table.integer('purchase_run_id').unsigned().nullable()
      table.foreign('purchase_run_id').references('id').inTable('purchase_runs').onDelete('SET NULL')

      table.integer('warehouse_id').unsigned().notNullable()
      table
        .foreign('warehouse_id')
        .references('id')
        .inTable('inventory_warehouses')
        .onDelete('RESTRICT')

      table.integer('source_warehouse_id').unsigned().nullable()
      table
        .foreign('source_warehouse_id')
        .references('id')
        .inTable('inventory_warehouses')
        .onDelete('RESTRICT')

      table.string('area_label', 60).nullable()

      table
        .enum('status', ['draft', 'in_progress', 'fulfilled', 'cancelled'], {
          useNative: true,
          enumName: 'stock_request_status',
          existingType: false,
        })
        .notNullable()
        .defaultTo('draft')

      table.timestamp('requested_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('fulfilled_at', { useTz: true }).nullable()

      table.string('notes', 200).nullable()
      table.string('created_by', 50).nullable()
      table.string('fulfilled_by', 50).nullable()

      table.index(['restaurant_id'], 'idx_stock_req_restaurant')
      table.index(['purchase_run_id'], 'idx_stock_req_run')
      table.index(['warehouse_id'], 'idx_stock_req_wh')
      table.index(['status'], 'idx_stock_req_status')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
