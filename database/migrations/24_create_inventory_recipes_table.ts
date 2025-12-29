import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_recipes'

  public async up() {
    this.schema.createTable(this.tableName, (t) => {
      t.increments('id').primary()

      t.integer('restaurant_id').notNullable()

      // Producto POS (pos-order-api) — usamos bigInteger por futuro
      t.bigInteger('pos_product_id').notNullable()
      t.string('pos_product_code', 80).nullable() // snapshot opcional (un poco más largo)

      t.boolean('is_active').notNullable().defaultTo(true)

      // ✅ estándar Adonis
      t.timestamps(true, true)
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX inventory_recipes_pos_product_uq
      ON inventory_recipes (restaurant_id, pos_product_id);
    `)
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
