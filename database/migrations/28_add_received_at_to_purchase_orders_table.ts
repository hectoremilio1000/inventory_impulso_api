import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_orders'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('received_at', { useTz: true }).nullable()
      table.index(['received_at'], 'idx_po_received_at')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['received_at'], 'idx_po_received_at')
      table.dropColumn('received_at')
    })
  }
}
