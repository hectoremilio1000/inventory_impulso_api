import type { HttpContext } from '@adonisjs/core/http'
import InventoryItem from '#models/inventory_item'
import InventoryItemPhoto from '#models/inventory_item_photo'
import FtpInventoryPhotoUploader from '#services/ftp_inventory_photo_uploader'

export default class InventoryItemPhotosController {
  // POST /api/inventory/items/:id/photos
  public async store({ params, request, response }: HttpContext) {
    const inventoryItemId = Number(params.id)

    await InventoryItem.findOrFail(inventoryItemId)

    const file = request.file('file', {
      size: '10mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!file) {
      return response.badRequest({ message: 'Archivo "file" requerido' })
    }
    if (!file.tmpPath) {
      return response.badRequest({ message: 'No se pudo leer el archivo temporal' })
    }

    const { url } = await FtpInventoryPhotoUploader.upload({
      inventoryItemId,
      localPath: file.tmpPath,
      originalName: file.clientName,
    })

    const sortOrder = Number(request.input('sortOrder', 0)) || 0

    const row = await InventoryItemPhoto.create({
      inventoryItemId,
      url,
      sortOrder,
    })

    return response.created(row)
  }

  // GET /api/inventory/items/:id/photos
  public async index({ params }: HttpContext) {
    const inventoryItemId = Number(params.id)
    await InventoryItem.findOrFail(inventoryItemId)

    return InventoryItemPhoto.query()
      .where('inventoryItemId', inventoryItemId)
      .orderBy('sortOrder', 'asc')
      .orderBy('id', 'asc')
  }

  // DELETE /api/inventory/items/:itemId/photos/:photoId
  public async destroy({ params, response }: HttpContext) {
    const inventoryItemId = Number(params.itemId)
    const photoId = Number(params.photoId)

    const row = await InventoryItemPhoto.query()
      .where('inventoryItemId', inventoryItemId)
      .where('id', photoId)
      .firstOrFail()

    await row.delete()
    return response.noContent()
  }
}
