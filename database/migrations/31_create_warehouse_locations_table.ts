// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/31_create_warehouse_locations_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'warehouse_locations'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.integer('warehouse_id').unsigned().notNullable()

      table.string('name', 120).notNullable()
      table.integer('parent_id').unsigned().nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.index(['restaurant_id'], 'idx_wh_loc_restaurant')
      table.index(['warehouse_id'], 'idx_wh_loc_warehouse')
      table.unique(['warehouse_id', 'name'], 'uq_wh_loc_name_per_warehouse')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
