// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/19_create_stock_counts_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_counts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()

      table.integer('warehouse_id').unsigned().notNullable()
      table
        .foreign('warehouse_id')
        .references('id')
        .inTable('inventory_warehouses')
        .onDelete('RESTRICT')

      table.timestamp('started_at', { useTz: true }).notNullable()
      table.timestamp('finished_at', { useTz: true }).nullable()

      table.string('status', 20).notNullable().defaultTo('in_progress')

      table.string('notes', 255).nullable()

      table.string('created_by', 50).nullable()
      table.string('closed_by', 50).nullable()
      table.index(['restaurant_id'], 'idx_stock_counts_restaurant')
      table.index(['warehouse_id'], 'idx_stock_counts_warehouse')
      table.index(['status'], 'idx_stock_counts_status')
      table.index(['started_at'], 'idx_stock_counts_started_at')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
