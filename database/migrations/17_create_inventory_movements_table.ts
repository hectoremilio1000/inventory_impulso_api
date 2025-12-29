// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/17_create_inventory_movements_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_movements'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()

      table.integer('warehouse_id').unsigned().notNullable()
      table
        .foreign('warehouse_id')
        .references('id')
        .inTable('inventory_warehouses')
        .onDelete('RESTRICT')

      table.integer('inventory_item_id').unsigned().notNullable()
      table
        .foreign('inventory_item_id')
        .references('id')
        .inTable('inventory_items')
        .onDelete('RESTRICT')

      table.integer('presentation_id').unsigned().nullable()
      table
        .foreign('presentation_id')
        .references('id')
        .inTable('inventory_presentations')
        .onDelete('SET NULL')

      table.string('movement_type', 30).notNullable()

      table.decimal('quantity_base', 14, 4).notNullable()
      table.decimal('unit_cost', 14, 6).nullable()
      table.decimal('total_cost', 14, 4).nullable()

      table.timestamp('movement_at', { useTz: true }).notNullable()

      // Referencia (para saber que viene de una compra)
      table.string('reference_type', 30).nullable() // 'purchase_order_item'
      table.integer('reference_id').unsigned().nullable()

      table.string('notes', 255).nullable()

      table.index(
        ['restaurant_id', 'warehouse_id', 'inventory_item_id'],
        'idx_inv_mov_rest_wh_item'
      )
      table.index(['restaurant_id', 'movement_at'], 'idx_inv_mov_rest_at')
      table.index(['warehouse_id', 'movement_at'], 'idx_inv_mov_wh_at')
      table.index(['inventory_item_id', 'movement_at'], 'idx_inv_mov_item_at')
      table.index(['reference_type', 'reference_id'], 'idx_inv_mov_ref')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
