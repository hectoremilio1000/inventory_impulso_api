// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/02_create_supplier_types_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'supplier_types'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('code', 5).notNullable().unique()
      table.string('description', 50).nullable()

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
