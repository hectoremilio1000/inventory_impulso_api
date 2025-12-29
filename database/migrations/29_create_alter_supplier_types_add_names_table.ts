import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'supplier_types'

  public async up() {
    await db.transaction(async (trx) => {
      // ✅ Evita que se quede colgado por locks eternamente
      await trx.rawQuery(`SET LOCAL lock_timeout = '5s'`)
      await trx.rawQuery(`SET LOCAL statement_timeout = '30s'`)

      // 1) Add column idempotente (si ya existe, no falla)
      await trx.rawQuery(`
        ALTER TABLE ${this.tableName}
        ADD COLUMN IF NOT EXISTS name VARCHAR(50)
      `)

      // 2) Backfill
      await trx.rawQuery(`
        UPDATE ${this.tableName}
        SET name = COALESCE(name, description, code)
        WHERE name IS NULL
      `)

      // 3) NOT NULL (si aún hay nulls, aquí fallará y te dirá por qué)
      await trx.rawQuery(`
        ALTER TABLE ${this.tableName}
        ALTER COLUMN name SET NOT NULL
      `)
    })
  }

  public async down() {
    await db.rawQuery(`
      ALTER TABLE ${this.tableName}
      DROP COLUMN IF EXISTS name
    `)
  }
}
