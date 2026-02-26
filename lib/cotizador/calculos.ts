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
 * Redondeo comercial (ej: 0.5 => .00 / .50)
 * mode='up' protege margen
 */
function roundToStep(value: number, step = 0.25, mode: 'nearest' | 'up' = 'up'): number {
  if (!Number.isFinite(value)) return 0
  if (step <= 0) return value
  const scaled = value / step
  const rounded = mode === 'up' ? Math.ceil(scaled) : Math.round(scaled)
  return rounded * step
}

/**
 * Vidas cobradas:
 * - Empresa/Otro: toda la población
 * - Municipio/Cooperativa: población * preset (incidenciaMensual como % facturable)
 */
function getVidasCobradas(state: QuoteState) {
  const pop = Math.max(0, state.contrato.poblacion)
  const inc = clamp01(state.planDesign.incidenciaMensual)
  const actuarial = isActuarialSegment(state.contrato.segmento)
  const vidasCobradas = actuarial ? pop * inc : pop
  return { pop, inc, actuarial, vidasCobradas }
}

/**
 * Fee fijo mensual de soporte/operación (automático)
 * - Si la población total < umbral => se cobra fee fijo.
 * - Si la población total >= umbral => fee 0 (incluido).
 */
function calcularFeeFijoSoporteMensual(popTotal: number) {
  if (popTotal <= 0) return 0
  return popTotal < FEE_FIJO_SOPORTE_UMBRAL_SIN_FEE ? FEE_FIJO_SOPORTE_MENSUAL_USD : 0
}

/**
 * Calcula el FEE "base empresa" (por vida) SIN importar el segmento.
 * Esto asegura que en municipio/cooperativa el fee por vida cobrada sea igual al de empresa.
 *
 * Supuesto empresa:
 * - costos fijos por toda la población
 * - costos variables por uso esperado = pop * incidencia
 * - el fee se divide SIEMPRE por pop
 */
function calcularFeeBaseEmpresa(state: QuoteState, planType: PlanType) {
  const { contrato, planDesign, costosBase, preciosComisiones } = state

  const pop = Math.max(0, contrato.poblacion)
  const inc = clamp01(planDesign.incidenciaMensual)
  const mesesContrato = Math.max(1, contrato.duracionMeses)

  // Uso esperado (empresa): una parte usa el servicio
  const vidasActivas = pop * inc

  const telemedEsperado = vidasActivas * planDesign.telemedIncluidoPorVida
  const faceScanEsperado =
    vidasActivas * planDesign.faceScanIncluidoPorVida * planDesign.scansPorEvento

  const costoTelemedMensual = telemedEsperado * costosBase.costoBaseTelemed
  const costoFaceScanMensual = faceScanEsperado * costosBase.costoBaseFaceScan

  // Costos fijos por toda la población
  const costoMantenimientoMensual = pop * costosBase.mantenimientoPorVida
  const costoMedicoMensual =
    planType === 'PLUS' || planType === 'FULL' ? pop * costosBase.costoMedicoPorVida : 0
  const costoAPMensual = planType === 'FULL' ? pop * costosBase.costoAPPorVida : 0

  const costoCoreMensual =
    costoMantenimientoMensual + costoTelemedMensual + costoFaceScanMensual + costoMedicoMensual
  const costoTotalMensual = costoCoreMensual + costoAPMensual

  // Reserva prorrateada
  const reservaMensual = contrato.reservaEnabled
    ? (costoTotalMensual * contrato.reservaMeses) / mesesContrato
    : 0

  // Gross-up comisiones
  const apConMargen = costoAPMensual * (1 + preciosComisiones.margenAP)
  const numerador = costoCoreMensual * preciosComisiones.markupCore + apConMargen + reservaMensual

  const totalComision =
    preciosComisiones.comisionVentas + (contrato.signerEnabled ? preciosComisiones.comisionSigner : 0)

  const denominador = Math.max(1 - totalComision, 0.01)
  const ingresoMensualRaw = numerador / denominador

  // Descuento comercial
  const ingresoMensualConDescuentoRaw = ingresoMensualRaw * (1 - preciosComisiones.descuentoComercial)

  // Fee empresa: divide por pop
  const feeRaw = pop > 0 ? ingresoMensualConDescuentoRaw / pop : 0
  const fee = roundToStep(feeRaw, 0.25, 'up')

  return { feePerCapita: fee }
}

/**
 * Calcula los resultados para un tipo de plan dado.
 *
 * Regla clave de segmento:
 * - El FEE por vida (feePerCapita) es el mismo que en empresa (misma lógica de pricing).
 * - Lo único que cambia es la base de facturación (vidasCobradas):
 *    - Empresa/Otro: pop
 *    - Municipio/Cooperativa: pop * incidencia
 */
export function calcularPlan(state: QuoteState, planType: PlanType): PlanResult {
  const { contrato, planDesign, costosBase, preciosComisiones } = state
  const mesesContrato = Math.max(1, contrato.duracionMeses)

  const { pop, inc, actuarial, vidasCobradas } = getVidasCobradas(state)

  // ✅ Fee SIEMPRE igual al de empresa
  const { feePerCapita } = calcularFeeBaseEmpresa(state, planType)

  // Fee fijo soporte (automático)
  const feeFijoSoporteMensual = calcularFeeFijoSoporteMensual(pop)

  // ✅ Facturación
  const ingresoPlanSinFeeFijo = feePerCapita * vidasCobradas
  const ingresoMensualConDescuento = ingresoPlanSinFeeFijo + feeFijoSoporteMensual

  // Ingreso "antes de descuento" consistente: el descuento aplica al componente per cápita,
  // el fee fijo soporte se mantiene (no se descuenta automáticamente).
  const factorDescuento = 1 - preciosComisiones.descuentoComercial
  const ingresoMensual = (factorDescuento > 0 ? ingresoPlanSinFeeFijo / factorDescuento : ingresoPlanSinFeeFijo) + feeFijoSoporteMensual

  /**
   * COSTEO para margen:
   * - Empresa: fijos sobre pop, variables sobre pop*inc (uso)
   * - Municipio/Cooperativa: fijos y variables sobre vidasCobradas
   */
  const vidasFijasCosteo = actuarial ? vidasCobradas : pop
  const vidasUsoCosteo = actuarial ? vidasCobradas : pop * inc

  const telemedEsperado = vidasUsoCosteo * planDesign.telemedIncluidoPorVida
  const faceScanEsperado = vidasUsoCosteo * planDesign.faceScanIncluidoPorVida * planDesign.scansPorEvento

  const costoTelemedMensual = telemedEsperado * costosBase.costoBaseTelemed
  const costoFaceScanMensual = faceScanEsperado * costosBase.costoBaseFaceScan

  const costoMantenimientoMensual = vidasFijasCosteo * costosBase.mantenimientoPorVida
  const costoMedicoMensual =
    planType === 'PLUS' || planType === 'FULL' ? vidasFijasCosteo * costosBase.costoMedicoPorVida : 0
  const costoAPMensual = planType === 'FULL' ? vidasFijasCosteo * costosBase.costoAPPorVida : 0

  const costoCoreMensual =
    costoMantenimientoMensual + costoTelemedMensual + costoFaceScanMensual + costoMedicoMensual
  const costoTotalMensual = costoCoreMensual + costoAPMensual

  // Reserva prorrateada (sobre costo real del segmento)
  const reservaMensual = contrato.reservaEnabled
    ? (costoTotalMensual * contrato.reservaMeses) / mesesContrato
    : 0

  // Comisiones USD (sobre el ingreso final, incluyendo fee fijo)
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

  const margenPorcentaje = ingresoMensualConDescuento > 0 ? utilidadBrutaMensual / ingresoMensualConDescuento : 0

  const facturaTotal =
    ingresoMensualConDescuento * mesesContrato + (contrato.startFeeEnabled ? contrato.startFeeAmount : 0)

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

  // Telemed a la carta
  let telemedUnitPrice = 0
  let telemedTotal = 0
  if (alaCartaTelemed.enabled) {
    telemedUnitPrice = getTelemedAlaCartePrice(alaCartaTelemed.cantidadMensual, alaCartaTelemed.tiers)
    telemedTotal = alaCartaTelemed.cantidadMensual * telemedUnitPrice
  }

  // FaceScan a la carta
  let faceScanUnitPrice = 0
  let faceScanTotal = 0
  if (alaCartaFaceScan.enabled) {
    faceScanUnitPrice = getFaceScanTierPrice(alaCartaFaceScan.scansAnuales)
    faceScanTotal = (alaCartaFaceScan.scansAnuales / 12) * faceScanUnitPrice
  }

  // Zentis
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
 * Calcula los totales unificados de la cotización.
 */
export function calcularTotalesCotizacion(
  state: QuoteState,
  planResult: PlanResult | null,
  alaCarteResult: AlaCarteResult
): QuoteTotals {
  const pop = Math.max(1, state.contrato.poblacion)
  const meses = Math.max(1, state.contrato.duracionMeses)

  const mensualPaquetes = alaCarteResult.totalMensual
  const mensualPlan =
    state.modo === 'PLANES' && state.planSeleccionado && planResult
      ? planResult.ingresoMensualConDescuento
      : 0

  const mensualTotal = mensualPlan + mensualPaquetes
  const startFee = state.contrato.startFeeEnabled ? state.contrato.startFeeAmount : 0
  const contratoTotal = mensualTotal * meses + startFee

  // Fee efectivo por vida total (siempre sobre población total para lectura comercial)
  const feePerCapitaTotal = mensualTotal / pop

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
