Tu “llave” es el producto del POS:

Product (pos-order-api) = el “producto vendido”

BOM (inventory_recipes) apunta a pos_product_id

Ops recipe apunta a pos_product_id

Template crea ese producto y luego crea su BOM y su ops recipe
