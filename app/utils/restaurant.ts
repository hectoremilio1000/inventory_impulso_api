// /Users/hectorvelasquez/proyectos/growthsuite/pos-app/inventory-api/app/utils/restaurant.ts

import type { HttpContext } from '@adonisjs/core/http'

export function getRestaurantId(ctx: HttpContext): number {
  // Si luego migras a ctx.authUser, aquí lo enchufas.
  const fromQuery = ctx.request.input('restaurantId') ?? ctx.request.qs().restaurantId
  const rid = Number(fromQuery)
  if (!rid || Number.isNaN(rid)) {
    throw new Error('restaurantId requerido (query o body)')
  }
  return rid
}
