import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'print_area_warehouse_maps'

  public async up() {
    this.schema.createTable(this.tableName, (t) => {
      t.increments('id').primary()

      t.integer('restaurant_id').notNullable()

      // viene de pos-order-api: products.print_area
      t.integer('print_area_id').notNullable()

      // vive en inventory: inventory_warehouses.id
      t.integer('warehouse_id')
        .notNullable()
        .references('id')
        .inTable('inventory_warehouses')
        .onDelete('RESTRICT') // ✅ recomendado: no borrar mapping por accidente

      t.timestamps(true, true)
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX print_area_warehouse_maps_uq
      ON print_area_warehouse_maps (restaurant_id, print_area_id);
    `)
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
