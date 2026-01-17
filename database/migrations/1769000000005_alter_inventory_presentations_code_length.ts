// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/1769000000005_alter_inventory_presentations_code_length.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_presentations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('code', 80).notNullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('code', 30).notNullable().alter()
    })
  }
}
