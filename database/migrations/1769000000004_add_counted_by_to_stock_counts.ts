import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_counts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('counted_by', 50).nullable()
      table.index(['counted_by'], 'idx_stock_counts_counted_by')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['counted_by'], 'idx_stock_counts_counted_by')
      table.dropColumn('counted_by')
    })
  }
}
