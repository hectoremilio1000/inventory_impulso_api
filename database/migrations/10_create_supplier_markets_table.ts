// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/10_create_supplier_markets_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'supplier_markets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.string('code', 20).notNullable()
      table.string('name', 100).nullable()
      table.string('description', 255).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.unique(['restaurant_id', 'code'])

      table.index(['restaurant_id'], 'idx_supplier_markets_restaurant')
      table.index(['is_active'], 'idx_supplier_markets_active')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
