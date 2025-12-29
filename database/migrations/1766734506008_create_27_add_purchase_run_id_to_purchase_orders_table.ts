import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_orders'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('purchase_run_id').unsigned().nullable()

      table
        .foreign('purchase_run_id')
        .references('id')
        .inTable('purchase_runs')
        .onDelete('SET NULL')

      table.index(['purchase_run_id'], 'idx_po_purchase_run')
      table.index(['restaurant_id', 'purchase_run_id'], 'idx_po_rest_run')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['restaurant_id', 'purchase_run_id'], 'idx_po_rest_run')
      table.dropIndex(['purchase_run_id'], 'idx_po_purchase_run')
      table.dropForeign(['purchase_run_id'])
      table.dropColumn('purchase_run_id')
    })
  }
}
