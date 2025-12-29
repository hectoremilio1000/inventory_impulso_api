const InventorySalesConsumptionController = () =>
  import('#controllers/inventory_sales_consumptions_controller')
const PurchaseRunsController = () => import('#controllers/purchase_runs_controller')
const InventoryPresentationSupplierCostsController = () =>
  import('#controllers/inventory_presentation_supplier_costs_controller')
import router from '@adonisjs/core/services/router'

const MeasurementUnitsController = () => import('#controllers/measurement_units_controller')
const SupplierTypesController = () => import('#controllers/supplier_types_controller')
const SuppliersController = () => import('#controllers/suppliers_controller')

const InventoryGroupsController = () => import('#controllers/inventory_groups_controller')
const InventoryItemsController = () => import('#controllers/inventory_items_controller')
const InventoryPresentationsController = () =>
  import('#controllers/inventory_presentations_controller')
const InventoryItemPhotosController = () => import('#controllers/inventory_item_photos_controller')

const SupplierMarketsController = () => import('#controllers/supplier_markets_controller')
const SupplierMarketSuppliersController = () =>
  import('#controllers/supplier_market_suppliers_controller')
const PurchaseRoutesController = () => import('#controllers/purchase_routes_controller')

const InventoryWarehousesController = () => import('#controllers/inventory_warehouses_controller')
const PurchaseOrdersController = () => import('#controllers/purchase_orders_controller')

const InventoryStocksController = () => import('#controllers/inventory_stocks_controller')
const StockCountsController = () => import('#controllers/stock_counts_controller')

// BOM controllers
const InventoryExternalRefsController = () =>
  import('#controllers/inventory_external_refs_controller')
const PrintAreaWarehouseMapsController = () =>
  import('#controllers/print_area_warehouse_maps_controller')
const InventoryRecipesController = () => import('#controllers/inventory_recipes_controller')

router
  .group(() => {
    /* ========= Catálogos ========= */
    router.get('/measurement-units', [MeasurementUnitsController, 'index'])
    router.post('/measurement-units', [MeasurementUnitsController, 'store'])
    router.get('/measurement-units/:id', [MeasurementUnitsController, 'show'])
    router.put('/measurement-units/:id', [MeasurementUnitsController, 'update'])
    router.delete('/measurement-units/:id', [MeasurementUnitsController, 'destroy'])

    router.get('/supplier-types', [SupplierTypesController, 'index'])
    router.post('/supplier-types', [SupplierTypesController, 'store'])
    router.put('/supplier-types/:id', [SupplierTypesController, 'update'])
    router.delete('/supplier-types/:id', [SupplierTypesController, 'destroy'])

    /* ========= Proveedores ========= */
    router.get('/suppliers', [SuppliersController, 'index'])
    router.post('/suppliers', [SuppliersController, 'store'])
    router.put('/suppliers/:id', [SuppliersController, 'update'])
    router.delete('/suppliers/:id', [SuppliersController, 'destroy'])

    router.get('/supplier-markets', [SupplierMarketsController, 'index'])
    router.post('/supplier-markets', [SupplierMarketsController, 'store'])
    router.put('/supplier-markets/:id', [SupplierMarketsController, 'update'])
    router.delete('/supplier-markets/:id', [SupplierMarketsController, 'destroy'])

    router.get('/supplier-markets/:marketId/suppliers', [
      SupplierMarketSuppliersController,
      'index',
    ])
    router.post('/supplier-markets/:marketId/suppliers', [
      SupplierMarketSuppliersController,
      'store',
    ])
    router.delete('/supplier-markets/:marketId/suppliers/:id', [
      SupplierMarketSuppliersController,
      'destroy',
    ])

    router.get('/purchase-routes', [PurchaseRoutesController, 'index'])
    router.post('/purchase-routes', [PurchaseRoutesController, 'store'])
    router.put('/purchase-routes/:id', [PurchaseRoutesController, 'update'])
    router.delete('/purchase-routes/:id', [PurchaseRoutesController, 'destroy'])

    /* ========= Inventario base ========= */
    router.get('/inventory/groups', [InventoryGroupsController, 'index'])
    router.post('/inventory/groups', [InventoryGroupsController, 'store'])
    router.put('/inventory/groups/:id', [InventoryGroupsController, 'update'])
    router.delete('/inventory/groups/:id', [InventoryGroupsController, 'destroy'])

    router.get('/inventory/items', [InventoryItemsController, 'index'])
    router.post('/inventory/items', [InventoryItemsController, 'store'])
    router.get('/inventory/items/:id', [InventoryItemsController, 'show'])
    router.put('/inventory/items/:id', [InventoryItemsController, 'update'])
    router.delete('/inventory/items/:id', [InventoryItemsController, 'destroy'])

    router.put('/inventory/items/:id/detail', [InventoryItemsController, 'upsertDetail'])

    router.get('/inventory/items/:itemId/presentations', [
      InventoryPresentationsController,
      'index',
    ])
    router.get('/inventory/presentations/search', [InventoryPresentationsController, 'search'])
    router.post('/inventory/presentations', [InventoryPresentationsController, 'store'])
    router.put('/inventory/presentations/:id', [InventoryPresentationsController, 'update'])
    router.put('/inventory/presentations/:id/detail', [
      InventoryPresentationsController,
      'upsertDetail',
    ])
    router.delete('/inventory/presentations/:id', [InventoryPresentationsController, 'destroy'])

    // ✅ NUEVO: proveedores/costos por presentación
    router.get('/inventory/presentations/:id/supplier-costs', [
      InventoryPresentationSupplierCostsController,
      'index',
    ])
    router.put('/inventory/presentations/:id/supplier-costs/:supplierId', [
      InventoryPresentationSupplierCostsController,
      'upsert',
    ])
    router.delete('/inventory/presentations/:id/supplier-costs/:supplierId', [
      InventoryPresentationSupplierCostsController,
      'destroy',
    ])

    router.get('/inventory/items/:id/photos', [InventoryItemPhotosController, 'index'])
    router.post('/inventory/items/:id/photos', [InventoryItemPhotosController, 'store'])
    router.delete('/inventory/items/:itemId/photos/:photoId', [
      InventoryItemPhotosController,
      'destroy',
    ])

    /* ========= Almacenes ========= */
    router.get('/inventory/warehouses', [InventoryWarehousesController, 'index'])
    router.post('/inventory/warehouses', [InventoryWarehousesController, 'store'])
    router.put('/inventory/warehouses/:id', [InventoryWarehousesController, 'update'])
    router.delete('/inventory/warehouses/:id', [InventoryWarehousesController, 'destroy'])

    /* ========= Compras ========= */
    router.get('/purchase-orders', [PurchaseOrdersController, 'index'])
    router.post('/purchase-orders', [PurchaseOrdersController, 'store'])
    router.get('/purchase-orders/:id', [PurchaseOrdersController, 'show'])
    // ✅ UPDATE (para que "Editar" NO cree duplicado)
    router.put('/purchase-orders/:id', [PurchaseOrdersController, 'update'])
    router.post('/purchase-orders/:id/items', [PurchaseOrdersController, 'addItem'])
    router.post('/purchase-orders/:id/receive', [PurchaseOrdersController, 'receive'])
    /* ========= Viajes de compra (purchase_runs) ========= */
    router.get('/purchase-runs', [PurchaseRunsController, 'index'])
    router.post('/purchase-runs', [PurchaseRunsController, 'store'])
    router.get('/purchase-runs/:id', [PurchaseRunsController, 'show'])
    router.post('/purchase-runs/:id/close', [PurchaseRunsController, 'close'])
    /* ========= Stocks ========= */
    router.get('/inventory/stocks', [InventoryStocksController, 'index'])

    /* ========= Conteos ========= */
    router.get('/stock-counts', [StockCountsController, 'index'])
    router.post('/stock-counts', [StockCountsController, 'store'])
    router.get('/stock-counts/:id', [StockCountsController, 'show'])
    router.post('/stock-counts/:id/items', [StockCountsController, 'addItem'])
    router.patch('/stock-counts/:id/items/:itemId', [StockCountsController, 'updateItem'])
    router.post('/stock-counts/:id/close', [StockCountsController, 'close'])
    router.get('inventory/external-refs', [InventoryExternalRefsController, 'index'])
    router.delete('inventory/external-refs/:id', [InventoryExternalRefsController, 'destroy'])

    router.get('inventory/print-area-warehouse-maps', [PrintAreaWarehouseMapsController, 'index'])
    router.post('inventory/print-area-warehouse-maps', [PrintAreaWarehouseMapsController, 'store'])
    router.put('inventory/print-area-warehouse-maps/:id', [
      PrintAreaWarehouseMapsController,
      'update',
    ])
    router.delete('inventory/print-area-warehouse-maps/:id', [
      PrintAreaWarehouseMapsController,
      'destroy',
    ])

    router.get('inventory/recipes', [InventoryRecipesController, 'index'])
    router.post('inventory/recipes', [InventoryRecipesController, 'store'])
    router.get('inventory/recipes/:id', [InventoryRecipesController, 'show'])
    router.put('inventory/recipes/:id', [InventoryRecipesController, 'update'])
    router.delete('inventory/recipes/:id', [InventoryRecipesController, 'destroy'])

    router.post('inventory/recipes/:id/lines', [InventoryRecipesController, 'upsertLine'])
    router.delete('inventory/recipes/:id/lines/:lineId', [InventoryRecipesController, 'deleteLine'])

    // ✅ ESTE ES EL QUE TE FALTA PARA DESCONTAR
    router.post('inventory/consumption/apply-sales', [InventorySalesConsumptionController, 'apply'])
  })
  .prefix('/api')
