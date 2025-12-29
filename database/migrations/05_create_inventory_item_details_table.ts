// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/05_create_inventory_item_details_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_item_details'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('inventory_item_id').unsigned().notNullable()
      table
        .foreign('inventory_item_id')
        .references('id')
        .inTable('inventory_items')
        .onDelete('CASCADE')

      table.boolean('is_stockable').nullable().defaultTo(true)

      table.decimal('last_cost', 14, 4).nullable()
      table.decimal('average_cost', 14, 4).nullable()

      table.decimal('tax1_rate', 5, 2).nullable()
      table.decimal('tax2_rate', 5, 2).nullable()
      table.decimal('tax3_rate', 5, 2).nullable()

      table.decimal('cost_with_taxes', 14, 4).nullable()
      table.decimal('waste_percent', 5, 2).nullable()

      table.boolean('auto_decrement_on_use').nullable()
      table.boolean('use_scale').nullable()
      table.boolean('low_stock_alert').notNullable().defaultTo(false)

      table.integer('status').nullable()
      table.decimal('standard_cost', 14, 4).nullable()

      table.unique(['inventory_item_id'])

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
