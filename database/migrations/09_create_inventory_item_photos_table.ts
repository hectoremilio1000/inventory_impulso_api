// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/09_create_inventory_item_photos_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_item_photos'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('inventory_item_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('inventory_items')
        .onDelete('CASCADE')

      table.text('url').notNullable()
      table.integer('sort_order').notNullable().defaultTo(0)

      table.timestamps(true, true)

      table.index(['inventory_item_id'], 'idx_inv_photos_item')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
