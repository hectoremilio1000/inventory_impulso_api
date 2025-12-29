// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/03_create_inventory_groups_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_groups'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()
      table.string('code', 5).notNullable()
      table.unique(['restaurant_id', 'code'])
      table.index(['restaurant_id'], 'idx_inv_groups_restaurant')
      table.string('name', 60).nullable()
      table.string('description', 255).nullable()

      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
