// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/13_create_inventory_warehouses_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_warehouses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()

      table.string('code', 10).notNullable()
      table.string('name', 80).nullable()
      table.string('description', 255).nullable()

      table.string('kind', 30).nullable().defaultTo('storage')
      table.boolean('is_active').notNullable().defaultTo(true)

      table.unique(['restaurant_id', 'code'])
      table.index(['restaurant_id'], 'idx_inv_wh_restaurant')
      table.index(['is_active'], 'idx_inv_wh_active')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
