import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_counts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.index(['deleted_at'], 'idx_stock_counts_deleted_at')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['deleted_at'], 'idx_stock_counts_deleted_at')
      table.dropColumn('deleted_at')
    })
  }
}
