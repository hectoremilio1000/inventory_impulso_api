import { BaseSeeder } from '@adonisjs/lucid/seeders'

import MeasurementUnit from '#models/measurement_unit'
import InventoryGroup from '#models/inventory_group'
import InventoryWarehouse from '#models/inventory_warehouse'
import SupplierType from '#models/supplier_type'
import Supplier from '#models/supplier'
import InventoryItem from '#models/inventory_item'
import InventoryItemDetail from '#models/inventory_item_detail'
import InventoryPresentation from '#models/inventory_presentation'
import InventoryPresentationDetail from '#models/inventory_presentation_detail'

export default class InventoryDemoSeeder extends BaseSeeder {
  public static developmentOnly = true

  public async run() {
    const restaurantId = Number(process.env.SEED_RESTAURANT_ID ?? 1)

    /* 1) Unidades */
    await MeasurementUnit.updateOrCreateMany('code', [
      { code: 'g', name: 'gramos', satCode: '', isActive: true },
      { code: 'kg', name: 'kilogramos', satCode: '', isActive: true },
      { code: 'ml', name: 'mililitros', satCode: '', isActive: true },
      { code: 'l', name: 'litros', satCode: '', isActive: true },
      { code: 'pza', name: 'piezas', satCode: '', isActive: true },
    ])

    const unitG = await MeasurementUnit.findByOrFail('code', 'g')
    const unitMl = await MeasurementUnit.findByOrFail('code', 'ml')

    /* 2) Tipos de proveedor */
    await SupplierType.updateOrCreateMany('code', [
      { code: 'ABAR', description: 'Abarrotes' },
      { code: 'CARN', description: 'Carnes' },
      { code: 'BEB', description: 'Bebidas' },
    ])

    /* 3) Grupos por restaurante */
    const groups = [
      {
        restaurantId,
        code: 'ALIM',
        name: 'Alimentos',
        description: 'Materias primas',
        isActive: true,
      },
      {
        restaurantId,
        code: 'BEB',
        name: 'Bebidas',
        description: 'Bebidas y mixers',
        isActive: true,
      },
      {
        restaurantId,
        code: 'EMP',
        name: 'Empaque',
        description: 'Desechables y empaque',
        isActive: true,
      },
    ]
    for (const g of groups) {
      await InventoryGroup.updateOrCreate({ restaurantId: g.restaurantId, code: g.code }, g)
    }

    const groupAlim = await InventoryGroup.query()
      .where('restaurantId', restaurantId)
      .where('code', 'ALIM')
      .firstOrFail()
    const groupBeb = await InventoryGroup.query()
      .where('restaurantId', restaurantId)
      .where('code', 'BEB')
      .firstOrFail()

    /* 4) Almacenes por restaurante */
    const warehouses = [
      {
        restaurantId,
        code: 'GEN',
        name: 'General',
        description: 'Almacén general',
        kind: 'storage',
        isActive: true,
      },
      { restaurantId, code: 'BAR', name: 'Bar', description: 'Barra', kind: 'bar', isActive: true },
      {
        restaurantId,
        code: 'COC',
        name: 'Cocina',
        description: 'Cocina',
        kind: 'kitchen',
        isActive: true,
      },
    ]
    for (const w of warehouses) {
      await InventoryWarehouse.updateOrCreate({ restaurantId: w.restaurantId, code: w.code }, w)
    }

    /* 5) Proveedores demo */
    const typeCarn = await SupplierType.findByOrFail('code', 'CARN')
    const typeBeb = await SupplierType.findByOrFail('code', 'BEB')

    const suppliers = [
      {
        restaurantId,
        code: 'COSTCO',
        name: 'Costco',
        supplierTypeId: typeCarn.id,
        isActive: true,
        autoDecrementEnabled: true,
        isDefault: false,
      },
      {
        restaurantId,
        code: 'SIGMA',
        name: 'Sigma Alimentos',
        supplierTypeId: typeCarn.id,
        isActive: true,
        autoDecrementEnabled: true,
        isDefault: false,
      },
      {
        restaurantId,
        code: 'COCA',
        name: 'Coca-Cola',
        supplierTypeId: typeBeb.id,
        isActive: true,
        autoDecrementEnabled: true,
        isDefault: false,
      },
    ]

    for (const s of suppliers) {
      await Supplier.updateOrCreate({ restaurantId: s.restaurantId, code: s.code }, s as any)
    }

    /* 6) Items + details (demo) */
    const demoItems = [
      {
        restaurantId,
        code: 'CARNE-RES-MLD',
        name: 'Carne molida de res',
        description: 'Carne molida estándar',
        groupId: groupAlim.id,
        unitId: unitG.id,
        kind: 'raw',
      },
      {
        restaurantId,
        code: 'LIMON',
        name: 'Limón',
        description: 'Limón para jugo y garnish',
        groupId: groupAlim.id,
        unitId: unitG.id,
        kind: 'raw',
      },
      {
        restaurantId,
        code: 'REF-COCA',
        name: 'Coca-Cola',
        description: 'Refresco de cola',
        groupId: groupBeb.id,
        unitId: unitMl.id,
        kind: 'raw',
      },
    ]

    for (const it of demoItems) {
      const item = await InventoryItem.updateOrCreate({ restaurantId, code: it.code }, it as any)
      await InventoryItemDetail.updateOrCreate(
        { inventoryItemId: item.id },
        { inventoryItemId: item.id, isStockable: true }
      )
    }

    const itemCarne = await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('code', 'CARNE-RES-MLD')
      .firstOrFail()
    const itemCoca = await InventoryItem.query()
      .where('restaurantId', restaurantId)
      .where('code', 'REF-COCA')
      .firstOrFail()

    /* 7) Presentaciones + details (demo) */
    // Carne: presentación "1 kg" (content_in_base_unit=1000 g)
    const presCarne = await InventoryPresentation.updateOrCreate(
      { inventoryItemId: itemCarne.id, code: 'KG' },
      {
        inventoryItemId: itemCarne.id,
        code: 'KG',
        name: 'Paquete 1 kg',
        presentationLabel: '1 kg',
        presentationUnitId: unitG.id,
        contentInBaseUnit: 1000,
        isDefaultPurchase: true,
        isActive: true,
      } as any
    )
    await InventoryPresentationDetail.updateOrCreate(
      { presentationId: presCarne.id },
      { presentationId: presCarne.id }
    )

    // Coca: presentación "600ml"
    const presCoca = await InventoryPresentation.updateOrCreate(
      { inventoryItemId: itemCoca.id, code: '600ML' },
      {
        inventoryItemId: itemCoca.id,
        code: '600ML',
        name: 'Botella 600 ml',
        presentationLabel: '600 ml',
        presentationUnitId: unitMl.id,
        contentInBaseUnit: 600,
        isDefaultPurchase: true,
        isActive: true,
      } as any
    )
    await InventoryPresentationDetail.updateOrCreate(
      { presentationId: presCoca.id },
      { presentationId: presCoca.id }
    )

    console.log('✅ Inventory demo seed listo')
    console.log(`   - restaurantId: ${restaurantId}`)
    console.log('   - unidades: g, kg, ml, l, pza')
    console.log('   - grupos: ALIM, BEB, EMP')
    console.log('   - almacenes: GEN, BAR, COC')
    console.log('   - items demo: CARNE-RES-MLD, LIMON, REF-COCA')
  }
}
