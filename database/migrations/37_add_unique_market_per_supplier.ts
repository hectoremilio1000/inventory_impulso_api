import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'supplier_market_suppliers'

  public async up() {
    await this.db.rawQuery(`
      DELETE FROM supplier_market_suppliers a
      USING supplier_market_suppliers b
      WHERE a.supplier_id = b.supplier_id
        AND a.id < b.id
    `)

    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['supplier_id'], 'uq_sms_supplier')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['supplier_id'], 'uq_sms_supplier')
    })
  }
}
