// Motor de cálculos del cotizador

import type {
  QuoteState,
  PlanResult,
  PlanType,
  AlaCarteResult,
  FaceScanTier,
  QuoteTotals,
} from './types'
import {
  FACESCAN_TIERS,
  ZENTIS_TIERS,
  ZENTIS_IMAGENES_PRECIO,
  ZENTIS_TRANSCRIPCION_PRECIO,
} from './constants'

/**
 * Calcula los resultados para un tipo de plan dado.
 * Aplica la lógica de costos, markup, comisiones y descuento.
 */
export function calcularPlan(state: QuoteState, planType: PlanType): PlanResult {
  const { contrato, planDesign, costosBase, preciosComisiones } = state
  const pop = contrato.poblacion

  // --- Uso esperado mensual ---
  const telemedEsperado = pop * planDesign.incidenciaMensual
  const faceScanEsperado = pop * planDesign.incidenciaMensual * planDesign.scansPorEvento

  // --- Capacidad incluida mensual ---
  const telemedIncluido = pop * planDesign.telemedIncluidoPorVida
  const faceScanIncluido = pop * planDesign.faceScanIncluidoPorVida

  // --- Uso costeable (mín entre esperado e incluido) ---
  const telemedCosteado = Math.min(telemedEsperado, telemedIncluido)
  const faceScanCosteado = Math.min(faceScanEsperado, faceScanIncluido)

  // --- Costos variables mensuales ---
  const costoTelemedMensual = telemedCosteado * costosBase.costoBaseTelemed
  const costoFaceScanMensual = faceScanCosteado * costosBase.costoBaseFaceScan

  // --- Costos fijos mensuales ---
  const costoMantenimientoMensual = pop * costosBase.mantenimientoPorVida

  // PLUS y FULL incluyen médico
  const costoMedicoMensual =
    planType === 'PLUS' || planType === 'FULL'
      ? pop * costosBase.costoMedicoPorVida
      : 0

  // Solo FULL incluye AP
  const costoAPMensual =
    planType === 'FULL' ? pop * costosBase.costoAPPorVida : 0

  // --- Costo CORE mensual (sin AP) ---
  const costoCoreMensual =
    costoMantenimientoMensual + costoTelemedMensual + costoFaceScanMensual + costoMedicoMensual

  const costoTotalMensual = costoCoreMensual + costoAPMensual

  // --- Reserva ---
  const reservaMensual = contrato.reservaEnabled
    ? (costoTotalMensual * contrato.reservaMeses) / contrato.duracionMeses
    : 0

  // --- Revenue con gross-up de comisiones ---
  const apConMargen = costoAPMensual * (1 + preciosComisiones.margenAP)
  const numerador =
    costoCoreMensual * preciosComisiones.markupCore + apConMargen + reservaMensual

  const totalComision =
    preciosComisiones.comisionVentas +
    (contrato.signerEnabled ? preciosComisiones.comisionSigner : 0)

  // Evitar división por cero
  const denominador = Math.max(1 - totalComision, 0.01)
  const ingresoMensual = numerador / denominador

  // --- Descuento comercial ---
  const ingresoMensualConDescuento =
    ingresoMensual * (1 - preciosComisiones.descuentoComercial)

  // --- Per-cápita ---
  const feePerCapita = pop > 0 ? ingresoMensualConDescuento / pop : 0

  // --- Comisiones en USD ---
  const comisionVentasUSD = ingresoMensualConDescuento * preciosComisiones.comisionVentas
  const comisionSignerUSD = contrato.signerEnabled
    ? ingresoMensualConDescuento * preciosComisiones.comisionSigner
    : 0

  // --- Utilidad bruta ---
  const utilidadBrutaMensual =
    ingresoMensualConDescuento -
    costoTotalMensual -
    reservaMensual -
    comisionVentasUSD -
    comisionSignerUSD

  const margenPorcentaje =
    ingresoMensualConDescuento > 0
      ? utilidadBrutaMensual / ingresoMensualConDescuento
      : 0

  // --- Total contrato ---
  const facturaTotal =
    ingresoMensualConDescuento * contrato.duracionMeses +
    (contrato.startFeeEnabled ? contrato.startFeeAmount : 0)

  // --- Excedentes ---
  const excedenteTelemed = Math.max(telemedEsperado - telemedIncluido, 0)
  const excedenteFaceScan = Math.max(faceScanEsperado - faceScanIncluido, 0)

  return {
    planType,
    costoTelemedMensual,
    costoFaceScanMensual,
    costoMantenimientoMensual,
    costoMedicoMensual,
    costoAPMensual,
    costoCoreMensual,
    costoTotalMensual,
    reservaMensual,
    ingresoMensual,
    ingresoMensualConDescuento,
    feePerCapita,
    facturaTotal,
    comisionVentasUSD,
    comisionSignerUSD,
    utilidadBrutaMensual,
    margenPorcentaje,
    excedenteTelemed,
    excedenteFaceScan,
  }
}

/**
 * Calcula los 3 planes a la vez.
 */
export function calcularTodosLosPlanes(state: QuoteState): Record<PlanType, PlanResult> {
  return {
    BASE: calcularPlan(state, 'BASE'),
    PLUS: calcularPlan(state, 'PLUS'),
    FULL: calcularPlan(state, 'FULL'),
  }
}

/**
 * Obtiene el tier de precio de FaceScan según volumen anual.
 */
export function getFaceScanTierPrice(
  scansAnuales: number,
  tiers: FaceScanTier[] = FACESCAN_TIERS
): number {
  let precio = tiers[0].precioUnitario
  for (const tier of tiers) {
    if (scansAnuales >= tier.minScans) {
      precio = tier.precioUnitario
    }
  }
  return precio
}

/**
 * Obtiene el precio por usuario de Zentis Assistant según cantidad.
 */
export function getZentisTierPrice(usuarios: number): number {
  for (const tier of ZENTIS_TIERS) {
    if (usuarios >= tier.minUsers && usuarios <= tier.maxUsers) {
      return tier.precioUsuario
    }
  }
  return ZENTIS_TIERS[ZENTIS_TIERS.length - 1].precioUsuario
}

/**
 * Obtiene el precio unitario de Telemed a la carta según cantidad.
 */
export function getTelemedAlaCartePrice(
  cantidad: number,
  tiers: { minQty: number; precioUnitario: number }[]
): number {
  let precio = tiers[0]?.precioUnitario ?? 0
  for (const tier of tiers) {
    if (cantidad >= tier.minQty) {
      precio = tier.precioUnitario
    }
  }
  return precio
}

/**
 * Calcula los totales de productos a la carta.
 */
export function calcularAlaCarte(state: QuoteState): AlaCarteResult {
  const { alaCartaTelemed, alaCartaFaceScan, alaCartaZentis } = state

  // --- Telemed a la carta ---
  let telemedUnitPrice = 0
  let telemedTotal = 0
  if (alaCartaTelemed.enabled) {
    telemedUnitPrice = getTelemedAlaCartePrice(
      alaCartaTelemed.cantidadMensual,
      alaCartaTelemed.tiers
    )
    telemedTotal = alaCartaTelemed.cantidadMensual * telemedUnitPrice
  }

  // --- FaceScan a la carta ---
  let faceScanUnitPrice = 0
  let faceScanTotal = 0
  if (alaCartaFaceScan.enabled) {
    faceScanUnitPrice = getFaceScanTierPrice(alaCartaFaceScan.scansAnuales)
    // Total mensual: scans anuales / 12 * precio unitario
    faceScanTotal = (alaCartaFaceScan.scansAnuales / 12) * faceScanUnitPrice
  }

  // --- Zentis ---
  let assistantMensual = 0
  let imagenesMensual = 0
  let transcripcionesMensual = 0
  if (alaCartaZentis.enabled) {
    const precioAssistant = getZentisTierPrice(alaCartaZentis.usuariosActivos)
    assistantMensual = alaCartaZentis.usuariosActivos * precioAssistant

    if (alaCartaZentis.zentisImagenes) {
      imagenesMensual = alaCartaZentis.zentisImagenesUsuarios * ZENTIS_IMAGENES_PRECIO
    }

    if (alaCartaZentis.transcripciones) {
      transcripcionesMensual = alaCartaZentis.transcripcionesCantidad * ZENTIS_TRANSCRIPCION_PRECIO
    }
  }

  const zentisTotal = assistantMensual + imagenesMensual + transcripcionesMensual
  const totalMensual = telemedTotal + faceScanTotal + zentisTotal

  return {
    telemedTotal,
    telemedUnitPrice,
    faceScanTotal,
    faceScanUnitPrice,
    zentisTotal,
    zentisDesglose: {
      assistantMensual,
      imagenesMensual,
      transcripcionesMensual,
    },
    totalMensual,
  }
}

/**
 * Calcula los totales unificados de la cotización, respetando el modo:
 * - PLANES: mensualPlan + mensualPaquetes
 * - SOLO_PAQUETES: mensualPlan = 0, solo paquetes
 *
 * Nota UX: esto evita “sumas fantasma” cuando el vendedor quiere cotizar solo
 * un paquete (ej. preventa FaceScan) sin plan.
 */
export function calcularTotalesCotizacion(
  state: QuoteState,
  planResult: PlanResult | null,
  alaCarteResult: AlaCarteResult
): QuoteTotals {
  const pop = state.contrato.poblacion
  const meses = Math.max(1, state.contrato.duracionMeses)

  const mensualPaquetes = alaCarteResult.totalMensual

  const mensualPlan =
    state.modo === 'PLANES' && state.planSeleccionado && planResult
      ? planResult.ingresoMensualConDescuento
      : 0

  const mensualTotal = mensualPlan + mensualPaquetes

  const startFee = state.contrato.startFeeEnabled ? state.contrato.startFeeAmount : 0

  const contratoTotal = mensualTotal * meses + startFee

  const feePerCapitaTotal = pop > 0 ? mensualTotal / pop : 0

  const comisionesPct =
    state.preciosComisiones.comisionVentas +
    (state.contrato.signerEnabled ? state.preciosComisiones.comisionSigner : 0)

  const comisionesMensual = mensualTotal * comisionesPct
  const comisionesContrato = comisionesMensual * meses

  return {
    mensualPlan,
    mensualPaquetes,
    mensualTotal,
    contratoTotal,
    feePerCapitaTotal,
    planSeleccionado: state.planSeleccionado,
    modo: state.modo,
    startFee,
    comisionesPct,
    comisionesMensual,
    comisionesContrato,
  }
}

/**
 * Formatea un número como moneda USD.
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatea un número como porcentaje.
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
