// Store centralizado con useReducer para el cotizador

import type { QuoteState, PlanType, Segmento } from './types'
import { INITIAL_STATE } from './constants'

/** Acciones posibles del reducer */
export type QuoteAction =
  // Contrato
  | { type: 'SET_NOMBRE_CLIENTE'; payload: string }
  | { type: 'SET_SEGMENTO'; payload: Segmento }
  | { type: 'SET_POBLACION'; payload: number }
  | { type: 'SET_DURACION_MESES'; payload: number }
  | { type: 'SET_START_FEE_ENABLED'; payload: boolean }
  | { type: 'SET_START_FEE_AMOUNT'; payload: number }
  | { type: 'SET_RESERVA_ENABLED'; payload: boolean }
  | { type: 'SET_RESERVA_MESES'; payload: number }
  | { type: 'SET_SIGNER_ENABLED'; payload: boolean }
  // Plan Design
  | { type: 'SET_TELEMED_INCLUIDO'; payload: number }
  | { type: 'SET_FACESCAN_INCLUIDO'; payload: number }
  | { type: 'SET_INCIDENCIA'; payload: number }
  | { type: 'SET_SCANS_POR_EVENTO'; payload: number }
  // Costos Base
  | { type: 'SET_COSTO_TELEMED'; payload: number }
  | { type: 'SET_COSTO_FACESCAN'; payload: number }
  | { type: 'SET_COSTO_MANTENIMIENTO'; payload: number }
  | { type: 'SET_COSTO_MEDICO'; payload: number }
  | { type: 'SET_COSTO_AP'; payload: number }
  // Precios y Comisiones
  | { type: 'SET_MARKUP_CORE'; payload: number }
  | { type: 'SET_MARGEN_AP'; payload: number }
  | { type: 'SET_COMISION_VENTAS'; payload: number }
  | { type: 'SET_COMISION_SIGNER'; payload: number }
  | { type: 'SET_DESCUENTO_COMERCIAL'; payload: number }
  // Plan seleccionado
  | { type: 'SET_PLAN_SELECCIONADO'; payload: PlanType }
  // A la carta - Telemed
  | { type: 'SET_ALC_TELEMED_ENABLED'; payload: boolean }
  | { type: 'SET_ALC_TELEMED_CANTIDAD'; payload: number }
  | { type: 'SET_ALC_TELEMED_TIERS'; payload: { minQty: number; precioUnitario: number }[] }
  // A la carta - FaceScan
  | { type: 'SET_ALC_FACESCAN_ENABLED'; payload: boolean }
  | { type: 'SET_ALC_FACESCAN_SCANS'; payload: number }
  // A la carta - Zentis
  | { type: 'SET_ALC_ZENTIS_ENABLED'; payload: boolean }
  | { type: 'SET_ALC_ZENTIS_USUARIOS'; payload: number }
  | { type: 'SET_ALC_ZENTIS_IMAGENES'; payload: boolean }
  | { type: 'SET_ALC_ZENTIS_IMAGENES_USUARIOS'; payload: number }
  | { type: 'SET_ALC_ZENTIS_TRANSCRIPCIONES'; payload: boolean }
  | { type: 'SET_ALC_ZENTIS_TRANSCRIPCIONES_CANTIDAD'; payload: number }
  | { type: 'SET_ALC_ZENTIS_INTEGRACIONES'; payload: boolean }
  | { type: 'SET_ALC_ZENTIS_INTEGRACIONES_NOTA'; payload: string }
  // Estado completo
  | { type: 'LOAD_STATE'; payload: QuoteState }
  | { type: 'RESET_STATE' }
  | { type: 'SET_QUOTE_NAME'; payload: string }

export function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    // --- Contrato ---
    case 'SET_NOMBRE_CLIENTE':
      return { ...state, contrato: { ...state.contrato, nombreCliente: action.payload } }
    case 'SET_SEGMENTO':
      return { ...state, contrato: { ...state.contrato, segmento: action.payload } }
    case 'SET_POBLACION':
      return { ...state, contrato: { ...state.contrato, poblacion: Math.max(1, action.payload) } }
    case 'SET_DURACION_MESES':
      return { ...state, contrato: { ...state.contrato, duracionMeses: Math.max(1, action.payload) } }
    case 'SET_START_FEE_ENABLED':
      return { ...state, contrato: { ...state.contrato, startFeeEnabled: action.payload } }
    case 'SET_START_FEE_AMOUNT':
      return { ...state, contrato: { ...state.contrato, startFeeAmount: Math.max(0, action.payload) } }
    case 'SET_RESERVA_ENABLED':
      return { ...state, contrato: { ...state.contrato, reservaEnabled: action.payload } }
    case 'SET_RESERVA_MESES':
      return { ...state, contrato: { ...state.contrato, reservaMeses: Math.max(0, Math.min(3, action.payload)) } }
    case 'SET_SIGNER_ENABLED':
      return { ...state, contrato: { ...state.contrato, signerEnabled: action.payload } }

    // --- Plan Design ---
    case 'SET_TELEMED_INCLUIDO':
      return { ...state, planDesign: { ...state.planDesign, telemedIncluidoPorVida: Math.max(0, action.payload) } }
    case 'SET_FACESCAN_INCLUIDO':
      return { ...state, planDesign: { ...state.planDesign, faceScanIncluidoPorVida: Math.max(0, action.payload) } }
    case 'SET_INCIDENCIA':
      return { ...state, planDesign: { ...state.planDesign, incidenciaMensual: Math.max(0, Math.min(1, action.payload)) } }
    case 'SET_SCANS_POR_EVENTO':
      return { ...state, planDesign: { ...state.planDesign, scansPorEvento: Math.max(1, action.payload) } }

    // --- Costos Base ---
    case 'SET_COSTO_TELEMED':
      return { ...state, costosBase: { ...state.costosBase, costoBaseTelemed: Math.max(0, action.payload) } }
    case 'SET_COSTO_FACESCAN':
      return { ...state, costosBase: { ...state.costosBase, costoBaseFaceScan: Math.max(0, action.payload) } }
    case 'SET_COSTO_MANTENIMIENTO':
      return { ...state, costosBase: { ...state.costosBase, mantenimientoPorVida: Math.max(0, action.payload) } }
    case 'SET_COSTO_MEDICO':
      return { ...state, costosBase: { ...state.costosBase, costoMedicoPorVida: Math.max(0, action.payload) } }
    case 'SET_COSTO_AP':
      return { ...state, costosBase: { ...state.costosBase, costoAPPorVida: Math.max(0, action.payload) } }

    // --- Precios y Comisiones ---
    case 'SET_MARKUP_CORE':
      return { ...state, preciosComisiones: { ...state.preciosComisiones, markupCore: Math.max(1, action.payload) } }
    case 'SET_MARGEN_AP':
      return { ...state, preciosComisiones: { ...state.preciosComisiones, margenAP: Math.max(0, Math.min(1, action.payload)) } }
    case 'SET_COMISION_VENTAS':
      return { ...state, preciosComisiones: { ...state.preciosComisiones, comisionVentas: Math.max(0, Math.min(0.5, action.payload)) } }
    case 'SET_COMISION_SIGNER':
      return { ...state, preciosComisiones: { ...state.preciosComisiones, comisionSigner: Math.max(0, Math.min(0.5, action.payload)) } }
    case 'SET_DESCUENTO_COMERCIAL':
      return { ...state, preciosComisiones: { ...state.preciosComisiones, descuentoComercial: Math.max(0, Math.min(0.3, action.payload)) } }

    // --- Plan seleccionado ---
    case 'SET_PLAN_SELECCIONADO':
      return { ...state, planSeleccionado: action.payload }

    // --- A la carta: Telemed ---
    case 'SET_ALC_TELEMED_ENABLED':
      return { ...state, alaCartaTelemed: { ...state.alaCartaTelemed, enabled: action.payload } }
    case 'SET_ALC_TELEMED_CANTIDAD':
      return { ...state, alaCartaTelemed: { ...state.alaCartaTelemed, cantidadMensual: Math.max(0, action.payload) } }
    case 'SET_ALC_TELEMED_TIERS':
      return { ...state, alaCartaTelemed: { ...state.alaCartaTelemed, tiers: action.payload } }

    // --- A la carta: FaceScan ---
    case 'SET_ALC_FACESCAN_ENABLED':
      return { ...state, alaCartaFaceScan: { ...state.alaCartaFaceScan, enabled: action.payload } }
    case 'SET_ALC_FACESCAN_SCANS':
      return { ...state, alaCartaFaceScan: { ...state.alaCartaFaceScan, scansAnuales: Math.max(0, action.payload) } }

    // --- A la carta: Zentis ---
    case 'SET_ALC_ZENTIS_ENABLED':
      return { ...state, alaCartaZentis: { ...state.alaCartaZentis, enabled: action.payload } }
    case 'SET_ALC_ZENTIS_USUARIOS':
      return { ...state, alaCartaZentis: { ...state.alaCartaZentis, usuariosActivos: Math.max(1, action.payload) } }
    case 'SET_ALC_ZENTIS_IMAGENES':
      return { ...state, alaCartaZentis: { ...state.alaCartaZentis, zentisImagenes: action.payload } }
    case 'SET_ALC_ZENTIS_IMAGENES_USUARIOS':
      return { ...state, alaCartaZentis: { ...state.alaCartaZentis, zentisImagenesUsuarios: Math.max(1, action.payload) } }
    case 'SET_ALC_ZENTIS_TRANSCRIPCIONES':
      return { ...state, alaCartaZentis: { ...state.alaCartaZentis, transcripciones: action.payload } }
    case 'SET_ALC_ZENTIS_TRANSCRIPCIONES_CANTIDAD':
      return { ...state, alaCartaZentis: { ...state.alaCartaZentis, transcripcionesCantidad: Math.max(0, action.payload) } }
    case 'SET_ALC_ZENTIS_INTEGRACIONES':
      return { ...state, alaCartaZentis: { ...state.alaCartaZentis, integraciones: action.payload } }
    case 'SET_ALC_ZENTIS_INTEGRACIONES_NOTA':
      return { ...state, alaCartaZentis: { ...state.alaCartaZentis, integracionesNota: action.payload } }

    // --- Estado completo ---
    case 'LOAD_STATE':
      return { ...action.payload }
    case 'RESET_STATE':
      return { ...INITIAL_STATE, quoteId: crypto.randomUUID(), quoteName: 'Nueva Cotización' }
    case 'SET_QUOTE_NAME':
      return { ...state, quoteName: action.payload }

    default:
      return state
  }
}
