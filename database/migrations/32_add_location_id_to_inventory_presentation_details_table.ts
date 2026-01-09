// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/32_add_location_id_to_inventory_presentation_details_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_presentation_details'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('location_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('warehouse_locations')
        .onDelete('SET NULL')
      table.index(['location_id'], 'idx_pres_details_location')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['location_id'], 'idx_pres_details_location')
      table.dropColumn('location_id')
    })
  }
}
