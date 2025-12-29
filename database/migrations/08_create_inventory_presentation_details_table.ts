// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/08_create_inventory_presentation_details_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_presentation_details'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('presentation_id').unsigned().notNullable()
      table
        .foreign('presentation_id')
        .references('id')
        .inTable('inventory_presentations')
        .onDelete('CASCADE')

      table.decimal('last_cost', 14, 4).nullable()
      table.decimal('average_cost', 14, 4).nullable()

      table.integer('supplier_id').unsigned().nullable()
      table.foreign('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL')

      table.decimal('tax1_rate', 5, 2).nullable()
      table.decimal('tax2_rate', 5, 2).nullable()
      table.decimal('tax3_rate', 5, 2).nullable()
      table.string('tax_indicator', 2).nullable()

      table.integer('status').nullable()

      table.boolean('auto_decrement_on_use').nullable()
      table.string('location', 150).nullable()
      table.boolean('use_scale').nullable()

      table.decimal('standard_cost', 14, 4).nullable()

      // Un detalle 1:1 por presentación
      table.unique(['presentation_id'])

      table.index(['supplier_id'], 'idx_pres_details_supplier')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
