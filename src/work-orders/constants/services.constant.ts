/**
 * CATÁLOGO OFICIAL DE SERVICIOS
 * 
 * Esta lista corresponde exactamente al formulario físico pre-impreso
 * usado en el taller "Frenos Aguilera".
 * 
 * Si necesitas agregar un nuevo servicio, actualiza esta constante
 * y automáticamente estará disponible para el Frontend.
 */

export const WORK_ORDER_SERVICES = [
  'Cambio Pastillas',
  'Cambio Balatas',
  'Cambio Liquido',
  'Cambio Gomas',
  'Rectificado',
  'Sangrado',
  'Cambio Piola',
  'Revision',
  'Otros'
] as const;

// Type helper para TypeScript (opcional)
export type WorkOrderServiceType = typeof WORK_ORDER_SERVICES[number];
