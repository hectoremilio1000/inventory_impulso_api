// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/11_create_supplier_market_suppliers_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'supplier_market_suppliers'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('supplier_market_id').unsigned().notNullable()
      table.integer('supplier_id').unsigned().notNullable()

      table
        .foreign('supplier_market_id')
        .references('id')
        .inTable('supplier_markets')
        .onDelete('CASCADE')

      table.foreign('supplier_id').references('id').inTable('suppliers').onDelete('RESTRICT')

      table.unique(['supplier_market_id', 'supplier_id'])

      table.index(['supplier_market_id'], 'idx_sms_market')
      table.index(['supplier_id'], 'idx_sms_supplier')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
