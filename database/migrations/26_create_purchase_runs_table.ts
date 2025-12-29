import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_runs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()

      // Secuencia por restaurante (1,2,3...) para generar RUN-YYYY-MM-DD-XX
      table.integer('run_number').unsigned().notNullable()

      table.string('run_code', 40).notNullable()
      table.string('title', 120).nullable()

      // fecha/hora del “viaje”
      table.timestamp('run_at', { useTz: true }).notNullable()

      table
        .enum('status', ['draft', 'in_progress', 'closed', 'cancelled'], {
          useNative: true,
          enumName: 'purchase_run_status',
          existingType: false,
        })
        .notNullable()
        .defaultTo('draft')

      table.string('notes', 255).nullable()
      table.string('created_by', 50).nullable()
      table.string('closed_by', 50).nullable()

      // Un run_number único por restaurante (para generar consecutivo)
      table.unique(['restaurant_id', 'run_number'])
      table.index(['restaurant_id'], 'idx_pr_run_restaurant')
      table.index(['restaurant_id', 'run_at'], 'idx_pr_run_rest_runat')
      table.index(['status'], 'idx_pr_run_status')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
    // Si quieres, podrías dropear el enum type manualmente,
    // pero no es necesario para dev si no estás reseteando tipos.
  }
}
