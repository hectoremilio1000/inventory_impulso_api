// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/01_create_measurement_units_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'measurement_units'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // idunidad  (g, kg, mL, L, piece, unit, etc.)
      table.string('code', 50).notNullable().unique()
      table.string('name', 60).nullable()
      // idunidadmedida_SAT  (código del SAT si aplica)

      table.string('sat_code', 50).nullable().defaultTo('')
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
