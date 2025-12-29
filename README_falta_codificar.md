1. Qué es “Kardex / Movimientos”

Es el historial auditable de inventario. Piensa en un “estado de cuenta” del stock:

Compra recibida → movimiento purchase (+2000g)

Conteo físico cerrado → movimiento stock_count_adjustment (-500g)

(más adelante) venta/receta → movimiento sale/recipe_consumption (-X)

El Kardex responde preguntas como:

“¿Por qué tengo 1500g hoy?”

“¿Qué eventos lo movieron y cuándo?”

“¿Quién ajustó por conteo?”

“¿Qué compra subió el stock?”

👉 Sin Kardex, sí puedes tener stock correcto, pero cuando algo no cuadra no tienes trazabilidad.

Esto NO es descuento automático, es visualización y auditoría.

1. inventory_item_details (solo “operación del insumo”)

Deja aquí:

is_stockable

waste_percent

low_stock_alert

use_scale (si aplica más al insumo)

(y cualquier regla operativa general)

Y quita/ignora aquí:

last_cost

average_cost

standard_cost

tax\*
Porque eso lo manejarás por presentación y te evita duplicidad/confusión.

No tienes que borrar columnas ahorita; basta con que el front ya no las use.
