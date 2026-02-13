// Tipos para el Cotizador Comercial Remoto de Arche Salud

/** Segmento del cliente */
export type Segmento = 'municipio' | 'cooperativa' | 'empresa' | 'otro'

/** Tipos de plan */
export type PlanType = 'BASE' | 'PLUS' | 'FULL'

/** Presets de incidencia */
export type IncidenciaPreset = 'conservador' | 'estandar' | 'moderado' | 'agresivo'

/** Estado del contrato y cliente */
export interface ContratoCliente {
  nombreCliente: string
  segmento: Segmento
  poblacion: number
  duracionMeses: number
  frecuenciaPago: 'mensual'
  startFeeEnabled: boolean
  startFeeAmount: number
  reservaEnabled: boolean
  reservaMeses: number
  signerEnabled: boolean
}

/** Configuración del diseño del plan */
export interface PlanDesign {
  telemedIncluidoPorVida: number
  faceScanIncluidoPorVida: number
  incidenciaMensual: number
  scansPorEvento: number
}

/** Costos base de producto (enmascarados) */
export interface CostosBase {
  costoBaseTelemed: number
  costoBaseFaceScan: number
  mantenimientoPorVida: number
  costoMedicoPorVida: number
  costoAPPorVida: number
}

/** Configuración de precios y comisiones */
export interface PreciosComisiones {
  markupCore: number
  margenAP: number
  comisionVentas: number
  comisionSigner: number
  descuentoComercial: number
}

/** Estado completo de la cotización */
export interface QuoteState {
  contrato: ContratoCliente
  planDesign: PlanDesign
  costosBase: CostosBase
  preciosComisiones: PreciosComisiones
  planSeleccionado: PlanType
  // A la carta
  alaCartaTelemed: AlaCartaTelemed
  alaCartaFaceScan: AlaCartaFaceScan
  alaCartaZentis: AlaCartaZentis
  // Cotizaciones guardadas
  quoteId: string
  quoteName: string
}

/** Resultado calculado por plan */
export interface PlanResult {
  planType: PlanType
  // Costos mensuales
  costoTelemedMensual: number
  costoFaceScanMensual: number
  costoMantenimientoMensual: number
  costoMedicoMensual: number
  costoAPMensual: number
  costoCoreMensual: number
  costoTotalMensual: number
  reservaMensual: number
  // Revenue
  ingresoMensual: number
  ingresoMensualConDescuento: number
  // Per-cápita
  feePerCapita: number
  // Contrato
  facturaTotal: number
  // Comisiones
  comisionVentasUSD: number
  comisionSignerUSD: number
  // Profit
  utilidadBrutaMensual: number
  margenPorcentaje: number
  // Excedentes
  excedenteTelemed: number
  excedenteFaceScan: number
}

/** Telemed a la carta */
export interface AlaCartaTelemed {
  enabled: boolean
  cantidadMensual: number
  tiers: TelemedTier[]
}

export interface TelemedTier {
  minQty: number
  precioUnitario: number
}

/** FaceScan a la carta */
export interface AlaCartaFaceScan {
  enabled: boolean
  scansAnuales: number
}

/** Tiers de FaceScan predefinidos */
export interface FaceScanTier {
  minScans: number
  precioUnitario: number
}

/** Zentis a la carta */
export interface AlaCartaZentis {
  enabled: boolean
  usuariosActivos: number
  zentisImagenes: boolean
  zentisImagenesUsuarios: number
  transcripciones: boolean
  transcripcionesCantidad: number
  integraciones: boolean
  integracionesNota: string
}

/** Cotización guardada */
export interface SavedQuote {
  id: string
  name: string
  state: QuoteState
  timestamp: number
}

/** Resultado a la carta */
export interface AlaCarteResult {
  telemedTotal: number
  telemedUnitPrice: number
  faceScanTotal: number
  faceScanUnitPrice: number
  zentisTotal: number
  zentisDesglose: {
    assistantMensual: number
    imagenesMensual: number
    transcripcionesMensual: number
  }
  totalMensual: number
}
