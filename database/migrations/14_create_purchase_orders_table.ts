// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/database/migrations/14_create_purchase_orders_table.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'purchase_orders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.integer('restaurant_id').unsigned().notNullable()

      table.integer('supplier_id').unsigned().notNullable()
      table.foreign('supplier_id').references('id').inTable('suppliers').onDelete('RESTRICT')

      table.integer('warehouse_id').unsigned().notNullable()
      table
        .foreign('warehouse_id')
        .references('id')
        .inTable('inventory_warehouses')
        .onDelete('RESTRICT')

      table.string('document_number', 30).nullable()
      table.string('invoice_number', 30).nullable()
      table.integer('order_number').unsigned().nullable()
      table.unique(['restaurant_id', 'order_number'])
      table.index(['restaurant_id', 'order_number'], 'idx_po_rest_order')

      table.date('issue_date').nullable()
      table.date('application_date').nullable()
      table.date('due_date').nullable()

      table
        .enum('status', ['draft', 'confirmed', 'received', 'cancelled'], {
          useNative: true,
          enumName: 'purchase_order_status',
          existingType: true, // ✅ clave
        })
        .notNullable()
        .defaultTo('draft')

      table.decimal('discount_percent', 5, 2).nullable()
      table.decimal('discount_amount', 14, 4).notNullable().defaultTo(0)

      table.decimal('subtotal', 14, 4).notNullable().defaultTo(0)
      table.decimal('tax1_amount', 14, 4).notNullable().defaultTo(0)
      table.decimal('tax2_amount', 14, 4).notNullable().defaultTo(0)
      table.decimal('tax3_amount', 14, 4).notNullable().defaultTo(0)
      table.decimal('total', 14, 4).notNullable().defaultTo(0)

      table.boolean('is_fiscal').notNullable().defaultTo(false)
      table.decimal('withholding_isr_percent', 5, 2).nullable()
      table.decimal('withholding_iva_percent', 5, 2).nullable()
      table.decimal('withholding_other_percent', 5, 2).nullable()

      table.string('reference', 100).nullable()
      table.string('created_by', 50).nullable()
      table.string('cancelled_by', 50).nullable()

      table.index(['restaurant_id'], 'idx_po_restaurant')
      table.index(['supplier_id'], 'idx_po_supplier')
      table.index(['warehouse_id'], 'idx_po_warehouse')
      table.index(['status'], 'idx_po_status')

      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
