// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/15_create_purchase_order_items_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_order_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('purchase_order_id').unsigned().notNullable()
      table
        .foreign('purchase_order_id')
        .references('id')
        .inTable('purchase_orders')
        .onDelete('CASCADE')

      table.integer('presentation_id').unsigned().notNullable()
      table
        .foreign('presentation_id')
        .references('id')
        .inTable('inventory_presentations')
        .onDelete('RESTRICT')

      table.decimal('quantity', 14, 4).notNullable()
      table.decimal('unit_price', 14, 4).notNullable()

      table.decimal('discount_amount', 14, 4).notNullable().defaultTo(0)

      table.decimal('tax_rate', 5, 2).nullable()
      table.decimal('tax_amount', 14, 4).notNullable().defaultTo(0)

      table.decimal('line_subtotal', 14, 4).notNullable().defaultTo(0)
      table.decimal('line_total', 14, 4).notNullable().defaultTo(0)

      table.string('notes', 150).nullable()
      table.index(['purchase_order_id'], 'idx_poi_po')
      table.index(['presentation_id'], 'idx_poi_presentation')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
