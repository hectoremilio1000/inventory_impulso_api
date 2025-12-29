// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/21_create_inventory_stocks_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_stocks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.index(['restaurant_id'], 'idx_inv_stocks_restaurant')

      table.integer('warehouse_id').unsigned().notNullable()
      table
        .foreign('warehouse_id')
        .references('id')
        .inTable('inventory_warehouses')
        .onDelete('RESTRICT')
      table.index(['warehouse_id'], 'idx_inv_stocks_warehouse')

      table.integer('inventory_item_id').unsigned().notNullable()
      table
        .foreign('inventory_item_id')
        .references('id')
        .inTable('inventory_items')
        .onDelete('RESTRICT')
      table.index(['inventory_item_id'], 'idx_inv_stocks_item')

      table.decimal('qty_on_hand_base', 14, 4).notNullable().defaultTo(0)

      table.decimal('avg_cost', 14, 6).nullable()

      table.timestamp('last_movement_at', { useTz: true }).nullable()

      table.unique(['restaurant_id', 'warehouse_id', 'inventory_item_id'])
      table.index(['restaurant_id', 'warehouse_id'], 'idx_inv_stocks_rest_wh')
      table.index(['warehouse_id', 'inventory_item_id'], 'idx_inv_stocks_wh_item')
      table.index(['last_movement_at'], 'idx_inv_stocks_last_move')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
