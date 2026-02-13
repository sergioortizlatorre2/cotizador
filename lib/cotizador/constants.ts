// Constantes y valores por defecto del cotizador

import type { FaceScanTier, QuoteState, IncidenciaPreset } from './types'

/**
 * Costos reales internos (NUNCA se muestran al usuario).
 * La app usa "Base Cost = realCost * 2" como costo base editable.
 */
const COSTOS_REALES = {
  telemed: 3.5,
  faceScan: 0.75,
  mantenimiento: 0.5,
  medico: 2.0,
  ap: 1.5,
}

/** Costos base por defecto (realCost * 2) */
export const COSTOS_BASE_DEFAULT = {
  costoBaseTelemed: COSTOS_REALES.telemed * 2,
  costoBaseFaceScan: COSTOS_REALES.faceScan * 2,
  mantenimientoPorVida: COSTOS_REALES.mantenimiento * 2,
  costoMedicoPorVida: COSTOS_REALES.medico * 2,
  costoAPPorVida: COSTOS_REALES.ap * 2,
}

/** Presets de incidencia */
export const INCIDENCIA_PRESETS: Record<IncidenciaPreset, number> = {
  conservador: 0.08,
  estandar: 0.12,
  moderado: 0.15,
  agresivo: 0.20,
}

/** Tiers de FaceScan (precio por scan según volumen anual) */
export const FACESCAN_TIERS: FaceScanTier[] = [
  { minScans: 0, precioUnitario: 2.0 },
  { minScans: 3000, precioUnitario: 1.8 },
  { minScans: 10000, precioUnitario: 1.7 },
  { minScans: 50000, precioUnitario: 1.5 },
  { minScans: 100000, precioUnitario: 1.2 },
  { minScans: 200000, precioUnitario: 0.9 },
  { minScans: 300000, precioUnitario: 0.75 },
]

/** Tiers de Zentis Assistant (precio por usuario/mes) */
export const ZENTIS_TIERS = [
  { minUsers: 1, maxUsers: 100, precioUsuario: 18 },
  { minUsers: 101, maxUsers: 200, precioUsuario: 17 },
  { minUsers: 201, maxUsers: 300, precioUsuario: 16 },
  { minUsers: 301, maxUsers: Infinity, precioUsuario: 15 },
]

/** Precio Zentis módulos opcionales */
export const ZENTIS_IMAGENES_PRECIO = 80 // USD por usuario/mes
export const ZENTIS_TRANSCRIPCION_PRECIO = 1 // USD por transcripción

/** Tiers default de Telemed a la carta */
export const TELEMED_TIERS_DEFAULT = [
  { minQty: 1, precioUnitario: COSTOS_BASE_DEFAULT.costoBaseTelemed * 2 },
  { minQty: 50, precioUnitario: COSTOS_BASE_DEFAULT.costoBaseTelemed * 1.8 },
  { minQty: 200, precioUnitario: COSTOS_BASE_DEFAULT.costoBaseTelemed * 1.5 },
]

/** Estado inicial de la cotización */
export const INITIAL_STATE: QuoteState = {
  contrato: {
    nombreCliente: '',
    segmento: 'empresa',
    poblacion: 1000,
    duracionMeses: 12,
    frecuenciaPago: 'mensual',
    startFeeEnabled: false,
    startFeeAmount: 5000,
    reservaEnabled: false,
    reservaMeses: 1,
    signerEnabled: false,
  },
  planDesign: {
    telemedIncluidoPorVida: 0.5,
    faceScanIncluidoPorVida: 0.5,
    incidenciaMensual: 0.12,
    scansPorEvento: 1,
  },
  costosBase: { ...COSTOS_BASE_DEFAULT },
  preciosComisiones: {
    markupCore: 2.5,
    margenAP: 0.3,
    comisionVentas: 0.1,
    comisionSigner: 0.15,
    descuentoComercial: 0,
  },
  planSeleccionado: 'PLUS',
  alaCartaTelemed: {
    enabled: false,
    cantidadMensual: 100,
    tiers: [...TELEMED_TIERS_DEFAULT],
  },
  alaCartaFaceScan: {
    enabled: false,
    scansAnuales: 5000,
  },
  alaCartaZentis: {
    enabled: false,
    usuariosActivos: 50,
    zentisImagenes: false,
    zentisImagenesUsuarios: 10,
    transcripciones: false,
    transcripcionesCantidad: 500,
    integraciones: false,
    integracionesNota: '',
  },
  quoteId: '',
  quoteName: 'Nueva Cotización',
}
