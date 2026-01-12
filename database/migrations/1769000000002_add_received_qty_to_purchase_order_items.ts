import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_order_items'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('received_qty', 14, 4).nullable().after('quantity')
      table.index(['received_qty'], 'idx_poi_received_qty')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['received_qty'], 'idx_poi_received_qty')
      table.dropColumn('received_qty')
    })
  }
}
