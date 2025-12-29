// app/services/ftp_inventory_photo_uploader.ts
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import ftp from 'basic-ftp'

type UploadOpts = {
  inventoryItemId: number
  localPath: string
  originalName?: string
}

export default class FtpInventoryPhotoUploader {
  static async upload({ inventoryItemId, localPath, originalName }: UploadOpts) {
    const host = process.env.FTPS_HOST!
    const port = Number(process.env.FTPS_PORT || 21)
    const user = process.env.FTPS_USER!
    const password = process.env.FTPS_PASS!
    const secure = String(process.env.FTPS_SECURE ?? 'true') === 'true'
    const baseUrl = process.env.MEDIA_BASE_URL! // ej: https://dominio.com/traspasos

    if (!host || !user || !password || !baseUrl) {
      throw new Error('FTPS/MEDIA_BASE_URL no configurados')
    }

    // extensión segura (permitimos imágenes típicas; fallback .jpg)
    const extRaw = (originalName && path.extname(originalName)) || path.extname(localPath) || '.jpg'

    const ext = extRaw.toLowerCase().replace(/[^.\w]/g, '') || '.jpg'

    // si quieres bloquear extensiones no-imagen, descomenta:
    // const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp'])
    // if (!allowed.has(ext)) throw new Error(`Extensión no permitida: ${ext}`)

    const fileName = `${Date.now()}-${randomUUID()}${ext}`

    // carpeta remota dentro de /traspasos
    // quedará: /traspasos/inventory/items/123/photos/...
    const remoteDir = `inventory/items/${inventoryItemId}/photos`

    const client = new ftp.Client()
    try {
      await client.access({ host, port, user, password, secure })
      await client.ensureDir(remoteDir)
      await client.uploadFrom(localPath, fileName)
      try {
        await client.cd('/')
      } catch {}
    } finally {
      try {
        client.close()
      } catch {}
      // borramos el temporal local para no llenar disco
      try {
        fs.unlinkSync(localPath)
      } catch {}
    }

    return {
      url: `${baseUrl}/inventory/items/${inventoryItemId}/photos/${fileName}`,
      filename: fileName,
    }
  }
}
