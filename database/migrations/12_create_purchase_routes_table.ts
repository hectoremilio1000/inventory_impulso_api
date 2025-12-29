// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/12_create_purchase_routes_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_routes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.string('route_code', 20).nullable()

      table.integer('supplier_market_id').unsigned().nullable()
      table
        .foreign('supplier_market_id')
        .references('id')
        .inTable('supplier_markets')
        .onDelete('CASCADE')

      table.integer('supplier_id').unsigned().nullable()
      table.foreign('supplier_id').references('id').inTable('suppliers').onDelete('RESTRICT')
      table.index(['supplier_id'], 'idx_purchase_routes_supplier')

      table.smallint('weekday').notNullable()
      table.time('start_time').nullable()
      table.time('end_time').nullable()
      table.smallint('sequence').nullable()
      table.string('notes', 255).nullable()

      table.index(['restaurant_id'], 'idx_purchase_routes_restaurant')
      table.index(['restaurant_id', 'weekday'], 'idx_purchase_routes_rest_weekday')
      table.index(['supplier_market_id'], 'idx_purchase_routes_market')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
