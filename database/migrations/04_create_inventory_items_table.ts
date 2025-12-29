// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/04_create_inventory_items_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()

      table.string('code', 30).notNullable()

      table.string('name', 100).nullable()

      table.string('description', 200).nullable()

      table.integer('group_id').unsigned().nullable()

      table.foreign('group_id').references('id').inTable('inventory_groups').onDelete('SET NULL')

      table.integer('unit_id').unsigned().nullable()
      table.foreign('unit_id').references('id').inTable('measurement_units').onDelete('RESTRICT')

      table.unique(['restaurant_id', 'code'])

      // tipo libre por ahora
      table.string('kind', 30).nullable().defaultTo('raw')

      table.index(['restaurant_id'], 'idx_inv_items_restaurant')
      table.index(['group_id'], 'idx_inv_items_group')
      table.index(['unit_id'], 'idx_inv_items_unit')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
