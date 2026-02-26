'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DollarSign, TrendingUp, Users, FileText, Info } from 'lucide-react'
import type { PlanResult, AlaCarteResult, PlanType, QuoteTotals, QuoteMode } from '@/lib/cotizador/types'
import { formatUSD, formatPercent } from '@/lib/cotizador/calculos'
import { useRole } from '@/lib/auth/useRole'

interface ResultadosSidebarProps {
  planResult: PlanResult | null
  alaCarteResult: AlaCarteResult
  totales: QuoteTotals
  modo: QuoteMode
  planSeleccionado: PlanType | null
  warnings: string[]
}

/** Panel lateral sticky con resumen de resultados */
export function ResultadosSidebar({
  planResult,
  totales,
  modo,
  planSeleccionado,
  warnings,
}: ResultadosSidebarProps) {
  const role = useRole()
  const showArche = role === 'admin'
  const showCommissions = role === 'admin' || role === 'sales'
  const showWarnings = role !== 'public'

  const totalMensual = totales.mensualTotal
  const totalContrato = totales.contratoTotal

  const margenColor =
    !planResult
      ? 'bg-muted text-muted-foreground'
      : planResult.margenPorcentaje < 0
        ? 'bg-destructive text-destructive-foreground'
        : planResult.margenPorcentaje < 0.15
          ? 'bg-warning text-warning-foreground'
          : 'bg-success text-success-foreground'

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Resultados
          </CardTitle>
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            {modo === 'SOLO_PAQUETES' ? 'Solo Paquetes' : planSeleccionado ? planSeleccionado : 'Sin plan'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Fee */}
        <div className="rounded-xl bg-primary/5 p-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 cursor-help">
                  <Users className="h-3 w-3" />
                  Fee Per Cápita / mes
                  <Info className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ingreso mensual dividido entre la población (para lectura comercial).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
            {formatUSD(totales.feePerCapitaTotal)}
          </p>
        </div>

        {/* Factura Mensual */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-3 w-3" />
            Factura Mensual
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {formatUSD(totalMensual)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plan: {formatUSD(totales.mensualPlan)} · Paquetes: {formatUSD(totales.mensualPaquetes)}
          </p>
        </div>

        <Separator />

        {/* Total Contrato */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <FileText className="h-3 w-3" />
            Total Contrato
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {formatUSD(totalContrato)}
          </p>
          {totales.startFee > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Incluye Start Fee: {formatUSD(totales.startFee)}
            </p>
          )}
        </div>

        {(showArche || showCommissions) && (
          <>
            <Separator />

            <div className="flex flex-col gap-2">
              {showArche && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Utilidad Bruta (Arche)</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {planResult ? `${formatUSD(planResult.utilidadBrutaMensual)}/mes` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Margen</span>
                    <Badge className={`${margenColor} text-xs`}>
                      {planResult ? formatPercent(planResult.margenPorcentaje) : '—'}
                    </Badge>
                  </div>
                </>
              )}

              {showCommissions && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Comisiones</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatUSD(totales.comisionesMensual)}/mes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Comisiones (%)</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatPercent(totales.comisionesPct)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Advertencias */}
        {showWarnings && warnings.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium"
                >
                  {w}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
