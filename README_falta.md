####

recipelines

Aquí va el cambio exacto para que NO marque idempotencia si la receta no tiene líneas.

La idea es:

Primero cargas recipeLines

Si recipeLines.length === 0 → no insertas en inventory_external_refs y haces noRecipeLines++

Solo si hay líneas: insertas external_ref y aplicas movimientos

1. Agrega el contador noRecipeLines

Busca donde declaras contadores y agrega uno:

ANTES
let appliedComponents = 0
let skippedAlreadyApplied = 0
let skippedNoMap = 0
let skippedNoRecipe = 0

DESPUÉS
let appliedComponents = 0
let skippedAlreadyApplied = 0
let skippedNoMap = 0
let skippedNoRecipe = 0
let skippedNoRecipeLines = 0 // ✅ NUEVO

2. Mueve la lectura de recipeLines antes del insert de external_refs
   ANTES (tu orden actual)

Insert external_ref

Luego haces recipeLines = ...

Loop recipeLines

DESPUÉS (reemplaza este bloque dentro del for (const consumeTarget...))

Reemplaza desde // 4) Idempotencia... hasta el final del loop de recipeLines por esto:

// 4) Cargar líneas de receta (ANTES de marcar idempotencia)
const recipeLines = await trx
.from('inventory_recipe_lines')
.where('recipe_id', Number(recipe.id))

if (!recipeLines || recipeLines.length === 0) {
skippedNoRecipeLines++
continue
}

// 5) Idempotencia por componente: orderItemId:posProductId
const now = DateTime.now().toSQL({ includeOffset: false })
const refId = `${orderItemId}:${consumeTarget.posProductId}`

const meta = {
orderId: line.orderId,
orderItemId,
soldAt: line.soldAt,
posProductId: consumeTarget.posProductId,
qty: consumeTarget.qty,
printAreaId: line.printAreaId ?? null,
printAreaName: line.printAreaName ?? null,
source: 'pos-order',
}

const res = await trx.rawQuery(
`   INSERT INTO inventory_external_refs
    (restaurant_id, source, ref_type, ref_id, meta, applied_at, created_at, updated_at)
  VALUES
    (?, ?, ?, ?, ?::jsonb, ?, ?, ?)
  ON CONFLICT (restaurant_id, source, ref_type, ref_id)
  DO NOTHING
  RETURNING id
  `,
[
restaurantId,
'pos-order',
'order_item_product',
refId,
JSON.stringify(meta),
now,
now,
now,
]
)

const didInsert = Array.isArray((res as any)?.rows) && (res as any).rows.length > 0
if (!didInsert) {
skippedAlreadyApplied++
continue
}

// 6) Aplicar líneas de receta (ya sabemos que existen)
for (const rl of recipeLines) {
const inventoryItemId = Number(rl.inventory_item_id)
const basePerUnit = Number(rl.qty_base)
const waste =
rl.waste_percent === null || rl.waste_percent === undefined ? 0 : Number(rl.waste_percent)

const consumeBase = basePerUnit _ consumeTarget.qty _ (1 + waste)
if (!consumeBase) continue

const qtyBase = -consumeBase

const stock = await InventoryStock.query({ client: trx })
.where('restaurantId', restaurantId)
.where('warehouseId', warehouseId)
.where('inventoryItemId', inventoryItemId)
.first()

const unitCost = stock?.avgCost ?? null
const totalCost = unitCost !== null ? Math.abs(qtyBase) \* Number(unitCost) : null

await InventoryMovement.create(
{
restaurantId,
warehouseId,
inventoryItemId,
presentationId: null,
movementType: 'sale_consumption',
quantityBase: qtyBase,
unitCost,
totalCost,
movementAt,
referenceType: 'pos_order_item',
referenceId: orderItemId,
notes: `Consumo por venta order#${line.orderId} item#${orderItemId} product#${consumeTarget.posProductId}`,
},
{ client: trx }
)

if (!stock) {
await InventoryStock.create(
{
restaurantId,
warehouseId,
inventoryItemId,
qtyOnHandBase: qtyBase,
avgCost: unitCost,
lastMovementAt: movementAt,
},
{ client: trx }
)
} else {
stock.useTransaction(trx)
stock.qtyOnHandBase = Number(stock.qtyOnHandBase) + qtyBase
stock.lastMovementAt = movementAt
await stock.save()
}
}

appliedComponents++

✅ Con esto, si una receta existe pero no tiene líneas, no se marca aplicada.

3. Agrega noRecipeLines en la respuesta
   ANTES
   skipped: {
   alreadyApplied: skippedAlreadyApplied,
   noMap: skippedNoMap,
   noRecipe: skippedNoRecipe,
   },

DESPUÉS
skipped: {
alreadyApplied: skippedAlreadyApplied,
noMap: skippedNoMap,
noRecipe: skippedNoRecipe,
noRecipeLines: skippedNoRecipeLines, // ✅ NUEVO
},

Con esto ya queda robusto y nunca tendrás que borrar refs por “receta vacía”.

Si quieres, también puedo hacer un ajuste extra: si el producto tiene receta pero qtyBase=0 en todas las líneas, lo trate como noRecipeLines (caso raro), pero con esto ya estás del otro lado.
