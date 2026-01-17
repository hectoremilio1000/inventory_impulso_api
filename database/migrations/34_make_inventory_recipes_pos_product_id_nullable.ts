import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_recipes'

  public async up() {
    this.schema.alterTable(this.tableName, (t) => {
      t.bigInteger('pos_product_id').nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (t) => {
      t.bigInteger('pos_product_id').notNullable().alter()
    })
  }
}
