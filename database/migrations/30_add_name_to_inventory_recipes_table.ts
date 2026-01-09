// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/30_add_name_to_inventory_recipes_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_recipes'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name', 150).nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('name')
    })
  }
}
