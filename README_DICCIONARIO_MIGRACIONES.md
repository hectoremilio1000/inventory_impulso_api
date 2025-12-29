4. Cómo lo amarras para que NO dupliques cosas

Tu “llave” es el producto del POS:

Product (pos-order-api) = el “producto vendido”

BOM (inventory_recipes) apunta a pos_product_id

Ops recipe apunta a pos_product_id

Template crea ese producto y luego crea su BOM y su ops recipe

✅ Así un “Margarita” tiene:

un producto POS

una receta BOM

una receta operativa

5. Qué te recomiendo hacer ya (sin volarte la cabeza)

Fase 1 (ahorita, para que inventory descuente):

BOM + mapping + idempotencia ✅

Fase 2 (recetario operativo usable):

ops_recipes + ops_recipe_steps (solo eso) ✅
sin ingredientes ahí, solo pasos y foto

Fase 3 (carga guiada “quiero montar mi bar”):

setup_templates + setup_template_items ✅
