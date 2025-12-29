import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_external_refs'

  public async up() {
    this.schema.createTable(this.tableName, (t) => {
      t.increments('id').primary()

      t.integer('restaurant_id').notNullable()

      // de dónde viene
      t.string('source', 30).notNullable() // 'pos-order' | 'softrestaurant' | 'excel'
      t.string('ref_type', 30).notNullable() // 'order_item' | 'ticket_line' | etc.

      // ✅ string para soportar refs no numéricas (A-12345, row-88, etc.)
      t.string('ref_id', 80).notNullable()

      // opcional: para debug/auditoría
      t.jsonb('meta').nullable()

      t.timestamp('applied_at', { useTz: true }).notNullable().defaultTo(this.now())

      t.timestamps(true, true)
    })

    // ✅ UNIQUE = idempotencia
    this.schema.raw(`
      CREATE UNIQUE INDEX inventory_external_refs_uq
      ON inventory_external_refs (restaurant_id, source, ref_type, ref_id);
    `)

    // ✅ índice útil para mantenimiento / limpieza / queries por tiempo
    this.schema.raw(`
      CREATE INDEX inventory_external_refs_applied_at_idx
      ON inventory_external_refs (restaurant_id, applied_at);
    `)
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
