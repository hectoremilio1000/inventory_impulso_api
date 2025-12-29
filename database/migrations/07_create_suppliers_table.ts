// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/07_create_suppliers_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'suppliers'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.index(['restaurant_id'], 'idx_suppliers_restaurant')

      table.string('code', 15).notNullable()
      table.unique(['restaurant_id', 'code'])

      table.string('name', 100).nullable()
      table.string('tax_name', 150).nullable()
      table.string('tax_id', 20).nullable()

      table.string('address', 200).nullable()
      table.string('postal_code', 15).nullable()
      table.string('phone', 30).nullable()
      table.string('whatsapp', 30).nullable()
      table.string('email', 150).nullable()

      table.smallint('credit_days').nullable()

      table.string('bank_name', 100).nullable()
      table.string('bank_account', 100).nullable()
      table.string('bank_clabe', 100).nullable()

      table.boolean('is_active').notNullable().defaultTo(true)

      table.integer('supplier_type_id').unsigned().nullable()
      table
        .foreign('supplier_type_id')
        .references('id')
        .inTable('supplier_types')
        .onDelete('SET NULL')

      table.boolean('auto_decrement_enabled').notNullable().defaultTo(true)
      table.boolean('is_default').notNullable().defaultTo(false)

      table.index(['supplier_type_id'], 'idx_suppliers_type')
      table.index(['is_active'], 'idx_suppliers_active')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
