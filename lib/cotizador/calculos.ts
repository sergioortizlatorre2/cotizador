// lib/cotizador/calculos.ts

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
  FEE_FIJO_SOPORTE_MENSUAL_USD,
  FEE_FIJO_SOPORTE_UMBRAL_SIN_FEE,
} from './constants'

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function isActuarialSegment(segmento: string) {
  return segmento === 'municipio' || segmento === 'cooperativa'
}

/**
 * Redondeo comercial
 */
function roundToStep(value: number, step = 0.25, mode: 'nearest' | 'up' = 'up'): number {
  if (!Number.isFinite(value)) return 0
  if (step <= 0) return value
  const scaled = value / step
  const rounded = mode === 'up' ? Math.ceil(scaled) : Math.round(scaled)
  return rounded * step
}

function calcularFeeFijoSoporteMensual(popTotal: number) {
  if (popTotal <= 0) return 0
  return popTotal < FEE_FIJO_SOPORTE_UMBRAL_SIN_FEE ? FEE_FIJO_SOPORTE_MENSUAL_USD : 0
}

function getTotalComisionPct(state: QuoteState) {
  return (
    state.preciosComisiones.comisionVentas +
    (state.contrato.signerEnabled ? state.preciosComisiones.comisionSigner : 0)
  )
}

function grossUpAndDiscount(netAmount: number, state: QuoteState) {
  const totalComisionPct = getTotalComisionPct(state)
  const denominator = Math.max(1 - totalComisionPct, 0.01)
  const grossed = netAmount / denominator
  return grossed * (1 - state.preciosComisiones.descuentoComercial)
}

/**
 * Telemed a la carta:
 * - base real = costo telemed * markupCore
 * - tiers aplican un FACTOR relativo respecto del primer tier cargado en UI
 * - luego se hace gross-up de comisiones + firmante y descuento comercial
 */
export function getTelemedAlaCarteBasePrice(state: QuoteState): number {
  const netBase = state.costosBase.costoBaseTelemed * state.preciosComisiones.markupCore
  return roundToStep(grossUpAndDiscount(netBase, state), 0.25, 'up')
}

export function getTelemedTierFactor(
  cantidad: number,
  tiers: { minQty: number; precioUnitario: number }[]
): number {
  const ordered = [...tiers].sort((a, b) => a.minQty - b.minQty)
  const baseRef = ordered[0]?.precioUnitario ?? 1
  let selectedRef = baseRef

  for (const tier of ordered) {
    if (cantidad >= tier.minQty) {
      selectedRef = tier.precioUnitario
    }
  }

  if (!Number.isFinite(baseRef) || baseRef <= 0) return 1
  const factor = selectedRef / baseRef
  return factor > 0 ? factor : 1
}

export function getTelemedAlaCartePrice(
  cantidad: number,
  tiers: { minQty: number; precioUnitario: number }[],
  state: QuoteState
): number {
  const basePrice = getTelemedAlaCarteBasePrice(state)
  const factor = getTelemedTierFactor(cantidad, tiers)
  return roundToStep(basePrice * factor, 0.25, 'up')
}

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

export function getFaceScanQuotedUnitPrice(state: QuoteState, scansAnuales: number): number {
  const basePrice = getFaceScanTierPrice(scansAnuales)
  return roundToStep(grossUpAndDiscount(basePrice, state), 0.25, 'up')
}

export function getZentisTierPrice(usuarios: number): number {
  for (const tier of ZENTIS_TIERS) {
    if (usuarios >= tier.minUsers && usuarios <= tier.maxUsers) {
      return tier.precioUsuario
    }
  }
  return ZENTIS_TIERS[ZENTIS_TIERS.length - 1].precioUsuario
}

export function getZentisQuotedUnitPrice(state: QuoteState, usuarios: number): number {
  const basePrice = getZentisTierPrice(usuarios)
  return roundToStep(grossUpAndDiscount(basePrice, state), 0.25, 'up')
}

export function getZentisImagenesQuotedUnitPrice(state: QuoteState): number {
  return roundToStep(grossUpAndDiscount(ZENTIS_IMAGENES_PRECIO, state), 0.25, 'up')
}

export function getZentisTranscripcionQuotedUnitPrice(state: QuoteState): number {
  return roundToStep(grossUpAndDiscount(ZENTIS_TRANSCRIPCION_PRECIO, state), 0.25, 'up')
}

/**
 * Cálculo BASE EMPRESA:
 * - costos fijos sobre toda la población
 * - costos variables sobre población * incidencia
 * - fee dividido por toda la población
 * Este resultado es la "base comercial" que luego se capita en municipio/cooperativa.
 */
function calcularPlanBaseEmpresa(state: QuoteState, planType: PlanType): PlanResult {
  const { contrato, planDesign, costosBase, preciosComisiones } = state

  const pop = Math.max(0, contrato.poblacion)
  const inc = clamp01(planDesign.incidenciaMensual)
  const mesesContrato = Math.max(1, contrato.duracionMeses)

  const vidasActivas = pop * inc

  const telemedEsperado = vidasActivas * planDesign.telemedIncluidoPorVida
  const faceScanEsperado =
    vidasActivas * planDesign.faceScanIncluidoPorVida * planDesign.scansPorEvento

  const costoTelemedMensual = telemedEsperado * costosBase.costoBaseTelemed
  const costoFaceScanMensual = faceScanEsperado * costosBase.costoBaseFaceScan

  const costoMantenimientoMensual = pop * costosBase.mantenimientoPorVida
  const costoMedicoMensual =
    planType === 'PLUS' || planType === 'FULL'
      ? pop * costosBase.costoMedicoPorVida
      : 0
  const costoAPMensual =
    planType === 'FULL'
      ? pop * costosBase.costoAPPorVida
      : 0

  const costoCoreMensual =
    costoMantenimientoMensual +
    costoTelemedMensual +
    costoFaceScanMensual +
    costoMedicoMensual

  const costoTotalMensual = costoCoreMensual + costoAPMensual

  const reservaMensual = contrato.reservaEnabled
    ? (costoTotalMensual * contrato.reservaMeses) / mesesContrato
    : 0

  const apConMargen = costoAPMensual * (1 + preciosComisiones.margenAP)

  const numerador =
    costoCoreMensual * preciosComisiones.markupCore + apConMargen + reservaMensual

  const totalComisionPct = getTotalComisionPct(state)
  const denominador = Math.max(1 - totalComisionPct, 0.01)
  const ingresoMensualRaw = numerador / denominador

  const ingresoMensualConDescuentoRaw =
    ingresoMensualRaw * (1 - preciosComisiones.descuentoComercial)

  const feePerCapitaRaw = pop > 0 ? ingresoMensualConDescuentoRaw / pop : 0
  const feePerCapita = roundToStep(feePerCapitaRaw, 0.25, 'up')

  const feeFijoSoporteMensual = calcularFeeFijoSoporteMensual(pop)

  const ingresoPlanSinFeeFijo = feePerCapita * pop
  const ingresoMensualConDescuento = ingresoPlanSinFeeFijo + feeFijoSoporteMensual

  const factorDescuento = 1 - preciosComisiones.descuentoComercial
  const ingresoMensual =
    (factorDescuento > 0 ? ingresoPlanSinFeeFijo / factorDescuento : ingresoPlanSinFeeFijo) +
    feeFijoSoporteMensual

  const comisionVentasUSD = ingresoMensualConDescuento * preciosComisiones.comisionVentas
  const comisionSignerUSD = contrato.signerEnabled
    ? ingresoMensualConDescuento * preciosComisiones.comisionSigner
    : 0

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

  const facturaTotal =
    ingresoMensualConDescuento * mesesContrato +
    (contrato.startFeeEnabled ? contrato.startFeeAmount : 0)

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
    excedenteTelemed: 0,
    excedenteFaceScan: 0,
  }
}

export function calcularPlan(state: QuoteState, planType: PlanType): PlanResult {
  const empresaBase = calcularPlanBaseEmpresa(state, planType)

  if (!isActuarialSegment(state.contrato.segmento)) {
    return empresaBase
  }

  const inc = clamp01(state.planDesign.incidenciaMensual)
  const mesesContrato = Math.max(1, state.contrato.duracionMeses)
  const pop = Math.max(0, state.contrato.poblacion)

  const feeFijoSoporteMensual = calcularFeeFijoSoporteMensual(pop)

  const ingresoPlanSinFeeFijo = empresaBase.feePerCapita * pop * inc
  const ingresoMensualConDescuento = ingresoPlanSinFeeFijo + feeFijoSoporteMensual

  const factorDescuento = 1 - state.preciosComisiones.descuentoComercial
  const ingresoMensual =
    (factorDescuento > 0 ? ingresoPlanSinFeeFijo / factorDescuento : ingresoPlanSinFeeFijo) +
    feeFijoSoporteMensual

  const costoTelemedMensual = empresaBase.costoTelemedMensual * inc
  const costoFaceScanMensual = empresaBase.costoFaceScanMensual * inc
  const costoMantenimientoMensual = empresaBase.costoMantenimientoMensual * inc
  const costoMedicoMensual = empresaBase.costoMedicoMensual * inc
  const costoAPMensual = empresaBase.costoAPMensual * inc
  const costoCoreMensual = empresaBase.costoCoreMensual * inc
  const costoTotalMensual = empresaBase.costoTotalMensual * inc
  const reservaMensual = empresaBase.reservaMensual * inc

  const comisionVentasUSD = ingresoMensualConDescuento * state.preciosComisiones.comisionVentas
  const comisionSignerUSD = state.contrato.signerEnabled
    ? ingresoMensualConDescuento * state.preciosComisiones.comisionSigner
    : 0

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

  const facturaTotal =
    ingresoMensualConDescuento * mesesContrato +
    (state.contrato.startFeeEnabled ? state.contrato.startFeeAmount : 0)

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
    feePerCapita: empresaBase.feePerCapita,
    facturaTotal,
    comisionVentasUSD,
    comisionSignerUSD,
    utilidadBrutaMensual,
    margenPorcentaje,
    excedenteTelemed: 0,
    excedenteFaceScan: 0,
  }
}

export function calcularTodosLosPlanes(state: QuoteState): Record<PlanType, PlanResult> {
  return {
    BASE: calcularPlan(state, 'BASE'),
    PLUS: calcularPlan(state, 'PLUS'),
    FULL: calcularPlan(state, 'FULL'),
  }
}

export function calcularAlaCarte(state: QuoteState): AlaCarteResult {
  const { alaCartaTelemed, alaCartaFaceScan, alaCartaZentis } = state

  let telemedUnitPrice = 0
  let telemedTotal = 0
  if (alaCartaTelemed.enabled) {
    telemedUnitPrice = getTelemedAlaCartePrice(
      alaCartaTelemed.cantidadMensual,
      alaCartaTelemed.tiers,
      state
    )
    telemedTotal = alaCartaTelemed.cantidadMensual * telemedUnitPrice
  }

  let faceScanUnitPrice = 0
  let faceScanTotal = 0
  if (alaCartaFaceScan.enabled) {
    faceScanUnitPrice = getFaceScanQuotedUnitPrice(state, alaCartaFaceScan.scansAnuales)
    faceScanTotal = (alaCartaFaceScan.scansAnuales / 12) * faceScanUnitPrice
  }

  let assistantMensual = 0
  let imagenesMensual = 0
  let transcripcionesMensual = 0
  if (alaCartaZentis.enabled) {
    const precioAssistant = getZentisQuotedUnitPrice(state, alaCartaZentis.usuariosActivos)
    assistantMensual = alaCartaZentis.usuariosActivos * precioAssistant

    if (alaCartaZentis.zentisImagenes) {
      imagenesMensual =
        alaCartaZentis.zentisImagenesUsuarios * getZentisImagenesQuotedUnitPrice(state)
    }

    if (alaCartaZentis.transcripciones) {
      transcripcionesMensual =
        alaCartaZentis.transcripcionesCantidad * getZentisTranscripcionQuotedUnitPrice(state)
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

export function calcularTotalesCotizacion(
  state: QuoteState,
  planResult: PlanResult | null,
  alaCarteResult: AlaCarteResult
): QuoteTotals {
  const meses = Math.max(1, state.contrato.duracionMeses)
  const mensualPaquetes = alaCarteResult.totalMensual

  const mensualPlan =
    state.modo === 'PLANES' && state.planSeleccionado && planResult
      ? planResult.ingresoMensualConDescuento
      : 0

  const mensualTotal = mensualPlan + mensualPaquetes
  const startFee = state.contrato.startFeeEnabled ? state.contrato.startFeeAmount : 0
  const contratoTotal = mensualTotal * meses + startFee

  const pop = Math.max(1, state.contrato.poblacion)
  const feePerCapitaTotal = mensualTotal / pop

  const comisionesPct = getTotalComisionPct(state)
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

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
