// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/16_create_inventory_presentation_supplier_costs_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_presentation_supplier_costs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.integer('supplier_id').unsigned().notNullable()
      table.integer('presentation_id').unsigned().notNullable()
      table.index(['restaurant_id'], 'idx_pres_costs_restaurant')
      table.foreign('supplier_id').references('id').inTable('suppliers').onDelete('RESTRICT')

      table
        .foreign('presentation_id')
        .references('id')
        .inTable('inventory_presentations')
        .onDelete('CASCADE')

      table.decimal('last_cost', 14, 4).nullable()
      table.timestamp('last_purchase_at', { useTz: true }).nullable()

      table.unique(['restaurant_id', 'supplier_id', 'presentation_id'])
      table.index(['supplier_id'], 'idx_pres_costs_supplier')
      table.index(['presentation_id'], 'idx_pres_costs_presentation')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
