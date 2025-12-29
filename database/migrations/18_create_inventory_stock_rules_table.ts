// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/18_create_inventory_stock_rules_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_stock_rules'

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
        .onDelete('RESTRICT')

      table.decimal('min_stock', 14, 4).nullable()
      table.decimal('ideal_stock', 14, 4).nullable()
      table.decimal('max_stock', 14, 4).nullable()

      table.unique(['restaurant_id', 'warehouse_id', 'inventory_item_id'])
      table.index(['restaurant_id'], 'idx_inv_rules_restaurant')
      table.index(['warehouse_id'], 'idx_inv_rules_wh')
      table.index(['inventory_item_id'], 'idx_inv_rules_item')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
