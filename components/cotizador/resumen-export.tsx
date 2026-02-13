'use client'

import { useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  FileDown,
  Link2,
  Save,
  Copy,
  Building2,
  Users,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  ClipboardCheck,
} from 'lucide-react'
import type { QuoteState, PlanResult, AlaCarteResult, SavedQuote } from '@/lib/cotizador/types'
import { formatUSD, formatPercent } from '@/lib/cotizador/calculos'
import { toast } from 'sonner'

interface ResumenExportProps {
  state: QuoteState
  planResult: PlanResult
  alaCarteResult: AlaCarteResult
  onSave: () => void
  onDuplicate: () => void
}

const SEGMENTO_LABELS: Record<string, string> = {
  municipio: 'Municipio',
  cooperativa: 'Cooperativa',
  empresa: 'Empresa',
  otro: 'Otro',
}

/** Tab de Resumen y Export */
export function ResumenExport({
  state,
  planResult,
  alaCarteResult,
  onSave,
  onDuplicate,
}: ResumenExportProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const { contrato, planDesign, preciosComisiones } = state

  const totalMensualConAddons =
    planResult.ingresoMensualConDescuento + alaCarteResult.totalMensual

  // --- Compartir vía URL ---
  const handleShareLink = useCallback(() => {
    try {
      const compressed = btoa(JSON.stringify(state))
      const url = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(compressed)}`
      navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    } catch {
      toast.error('Error al generar enlace')
    }
  }, [state])

  // --- Exportar PDF (usando window.print con estilos) ---
  const handleExportPDF = useCallback(() => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Habilita las ventanas emergentes para exportar PDF')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cotización - ${contrato.nombreCliente || 'Cliente'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #1a2332; padding: 40px; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 2px solid #1a9a8a; padding-bottom: 16px; }
          .logo { font-size: 22px; font-weight: 700; color: #1a9a8a; }
          .subtitle { font-size: 12px; color: #666; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: 600; color: #1a9a8a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
          .item-label { color: #666; }
          .item-value { font-weight: 600; }
          .big-number { font-size: 28px; font-weight: 700; color: #1a2332; }
          .highlight-box { background: #f0faf9; border: 1px solid #d0edea; border-radius: 8px; padding: 16px; margin: 12px 0; }
          .plan-badge { background: #1a9a8a; color: white; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Arche Salud</div>
            <div class="subtitle">Cotización Comercial</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:600">${contrato.nombreCliente || 'Cliente'}</div>
            <div class="subtitle">${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Contrato</div>
          <div class="grid">
            <div class="item"><span class="item-label">Segmento</span><span class="item-value">${SEGMENTO_LABELS[contrato.segmento]}</span></div>
            <div class="item"><span class="item-label">Población</span><span class="item-value">${contrato.poblacion.toLocaleString()} vidas</span></div>
            <div class="item"><span class="item-label">Duración</span><span class="item-value">${contrato.duracionMeses} meses</span></div>
            <div class="item"><span class="item-label">Plan</span><span class="item-value"><span class="plan-badge">${state.planSeleccionado}</span></span></div>
          </div>
        </div>

        <div class="highlight-box">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="color:#666;font-size:11px;">Fee Per Cápita / mes</div>
              <div class="big-number">${formatUSD(planResult.feePerCapita)}</div>
            </div>
            <div style="text-align:right;">
              <div style="color:#666;font-size:11px;">Factura Mensual</div>
              <div style="font-size:20px;font-weight:700;">${formatUSD(planResult.ingresoMensualConDescuento)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Resumen Financiero</div>
          <div class="item"><span class="item-label">Factura Mensual (Plan)</span><span class="item-value">${formatUSD(planResult.ingresoMensualConDescuento)}</span></div>
          ${alaCarteResult.totalMensual > 0 ? `<div class="item"><span class="item-label">Add-ons Mensual</span><span class="item-value">${formatUSD(alaCarteResult.totalMensual)}</span></div>` : ''}
          ${alaCarteResult.totalMensual > 0 ? `<div class="item"><span class="item-label">Total Mensual</span><span class="item-value">${formatUSD(totalMensualConAddons)}</span></div>` : ''}
          <div class="item"><span class="item-label">Total Contrato</span><span class="item-value" style="font-size:16px;color:#1a9a8a;">${formatUSD(planResult.facturaTotal)}</span></div>
          ${contrato.startFeeEnabled ? `<div class="item"><span class="item-label">Start Fee</span><span class="item-value">${formatUSD(contrato.startFeeAmount)}</span></div>` : ''}
        </div>

        ${alaCarteResult.totalMensual > 0 ? `
        <div class="section">
          <div class="section-title">Add-ons</div>
          ${alaCarteResult.telemedTotal > 0 ? `<div class="item"><span class="item-label">Telemed a la carta</span><span class="item-value">${formatUSD(alaCarteResult.telemedTotal)}/mes</span></div>` : ''}
          ${alaCarteResult.faceScanTotal > 0 ? `<div class="item"><span class="item-label">FaceScan</span><span class="item-value">${formatUSD(alaCarteResult.faceScanTotal)}/mes</span></div>` : ''}
          ${alaCarteResult.zentisTotal > 0 ? `<div class="item"><span class="item-label">Zentis Assistant</span><span class="item-value">${formatUSD(alaCarteResult.zentisTotal)}/mes</span></div>` : ''}
        </div>` : ''}

        <div class="section">
          <div class="section-title">Supuestos</div>
          <div class="grid">
            <div class="item"><span class="item-label">Incidencia mensual</span><span class="item-value">${formatPercent(planDesign.incidenciaMensual)}</span></div>
            <div class="item"><span class="item-label">Telemed incluido/vida</span><span class="item-value">${planDesign.telemedIncluidoPorVida}</span></div>
            <div class="item"><span class="item-label">FaceScan incluido/vida</span><span class="item-value">${planDesign.faceScanIncluidoPorVida}</span></div>
            <div class="item"><span class="item-label">Reserva</span><span class="item-value">${contrato.reservaEnabled ? `${contrato.reservaMeses} mes(es)` : 'No'}</span></div>
            <div class="item"><span class="item-label">Firmante</span><span class="item-value">${contrato.signerEnabled ? 'Sí' : 'No'}</span></div>
          </div>
        </div>

        <div class="footer">
          Cotización generada por Arche Salud - Cotizador Comercial | ${new Date().toLocaleDateString('es-ES')}
          <br/>Esta cotización es una estimación y no constituye un contrato vinculante.
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }, [state, contrato, planDesign, planResult, alaCarteResult, totalMensualConAddons, preciosComisiones])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Resumen de Cotización</h2>
        <p className="text-sm text-muted-foreground">
          Revisa todos los detalles antes de exportar o compartir la cotización.
        </p>
      </div>

      <div ref={printRef} className="flex flex-col gap-4">
        {/* Info del Cliente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              Datos del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{contrato.nombreCliente || '(Sin nombre)'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Segmento</span>
                <span className="font-medium">{SEGMENTO_LABELS[contrato.segmento]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Población</span>
                <span className="font-medium">{contrato.poblacion.toLocaleString()} vidas</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duración</span>
                <span className="font-medium">{contrato.duracionMeses} meses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan seleccionado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Plan Seleccionado
              <Badge className="ml-auto">{state.planSeleccionado}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-primary/5 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Per Cápita / mes</p>
                <p className="text-2xl font-bold text-foreground">{formatUSD(planResult.feePerCapita)}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Factura Mensual</p>
                <p className="text-2xl font-bold text-foreground">{formatUSD(planResult.ingresoMensualConDescuento)}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Contrato</p>
                <p className="text-2xl font-bold text-foreground">{formatUSD(planResult.facturaTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add-ons */}
        {alaCarteResult.totalMensual > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-primary" />
                Add-ons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {alaCarteResult.telemedTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Telemed a la carta</span>
                    <span className="font-medium">{formatUSD(alaCarteResult.telemedTotal)}/mes</span>
                  </div>
                )}
                {alaCarteResult.faceScanTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">FaceScan</span>
                    <span className="font-medium">{formatUSD(alaCarteResult.faceScanTotal)}/mes</span>
                  </div>
                )}
                {alaCarteResult.zentisTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Zentis Assistant</span>
                    <span className="font-medium">{formatUSD(alaCarteResult.zentisTotal)}/mes</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total Add-ons</span>
                  <span className="text-primary">{formatUSD(alaCarteResult.totalMensual)}/mes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profit interno */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Rentabilidad (Interno)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Utilidad Bruta</span>
                <span className="font-medium">{formatUSD(planResult.utilidadBrutaMensual)}/mes</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Margen</span>
                <Badge
                  className={
                    planResult.margenPorcentaje < 0
                      ? 'bg-destructive text-destructive-foreground'
                      : planResult.margenPorcentaje < 0.15
                        ? 'bg-warning text-warning-foreground'
                        : 'bg-success text-success-foreground'
                  }
                >
                  {formatPercent(planResult.margenPorcentaje)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Comisión Ventas</span>
                <span className="font-medium">{formatUSD(planResult.comisionVentasUSD)}/mes</span>
              </div>
              {planResult.comisionSignerUSD > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Comisión Firmante</span>
                  <span className="font-medium">{formatUSD(planResult.comisionSignerUSD)}/mes</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supuestos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              Supuestos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Incidencia mensual</span>
                <span className="font-medium">{formatPercent(planDesign.incidenciaMensual)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Telemed incluido/vida</span>
                <span className="font-medium">{planDesign.telemedIncluidoPorVida}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">FaceScan incluido/vida</span>
                <span className="font-medium">{planDesign.faceScanIncluidoPorVida}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reserva</span>
                <span className="font-medium">
                  {contrato.reservaEnabled ? `${contrato.reservaMeses} mes(es)` : 'Desactivada'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Firmante (Signer)</span>
                <span className="font-medium">{contrato.signerEnabled ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Descuento comercial</span>
                <span className="font-medium">{formatPercent(preciosComisiones.descuentoComercial)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleExportPDF} className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
        <Button variant="outline" onClick={handleShareLink} className="gap-2">
          <Link2 className="h-4 w-4" />
          Copiar enlace
        </Button>
        <Button variant="outline" onClick={onSave} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar cotización
        </Button>
        <Button variant="outline" onClick={onDuplicate} className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicar
        </Button>
      </div>
    </div>
  )
}
