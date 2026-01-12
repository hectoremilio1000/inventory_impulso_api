import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_request_items'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('fulfilled_qty', 14, 4).nullable().after('quantity')
      table.index(['fulfilled_qty'], 'idx_sri_fulfilled_qty')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['fulfilled_qty'], 'idx_sri_fulfilled_qty')
      table.dropColumn('fulfilled_qty')
    })
  }
}
