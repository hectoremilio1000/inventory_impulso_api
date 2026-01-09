import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_request_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('stock_request_id').unsigned().notNullable()
      table
        .foreign('stock_request_id')
        .references('id')
        .inTable('stock_requests')
        .onDelete('CASCADE')

      table.integer('presentation_id').unsigned().notNullable()
      table
        .foreign('presentation_id')
        .references('id')
        .inTable('inventory_presentations')
        .onDelete('RESTRICT')

      table.decimal('quantity', 14, 4).notNullable()
      table.string('notes', 150).nullable()

      table.index(['stock_request_id'], 'idx_sri_request')
      table.index(['presentation_id'], 'idx_sri_presentation')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
