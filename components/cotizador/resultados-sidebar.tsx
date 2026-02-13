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
import type { PlanResult, AlaCarteResult, PlanType } from '@/lib/cotizador/types'
import { formatUSD, formatPercent } from '@/lib/cotizador/calculos'

interface ResultadosSidebarProps {
  planResult: PlanResult
  alaCarteResult: AlaCarteResult
  planSeleccionado: PlanType
  warnings: string[]
}

/** Panel lateral sticky con resumen de resultados */
export function ResultadosSidebar({
  planResult,
  alaCarteResult,
  planSeleccionado,
  warnings,
}: ResultadosSidebarProps) {
  const totalMensualConAddons =
    planResult.ingresoMensualConDescuento + alaCarteResult.totalMensual
  const totalContratoConAddons =
    planResult.facturaTotal + alaCarteResult.totalMensual * (planResult.facturaTotal / (planResult.ingresoMensualConDescuento || 1))

  const margenColor =
    planResult.margenPorcentaje < 0
      ? 'bg-destructive text-destructive-foreground'
      : planResult.margenPorcentaje < 0.15
        ? 'bg-warning text-warning-foreground'
        : 'bg-success text-success-foreground'

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Resultados
          </CardTitle>
          <Badge variant="outline" className="border-primary/30 text-primary font-semibold">
            {planSeleccionado}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Per Cápita */}
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
                <p>Ingreso mensual dividido entre la población total.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {formatUSD(planResult.feePerCapita)}
          </p>
        </div>

        {/* Factura Mensual */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-3 w-3" />
            Factura Mensual
          </div>
          <p className="text-xl font-bold text-foreground">
            {formatUSD(planResult.ingresoMensualConDescuento)}
          </p>
          {alaCarteResult.totalMensual > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              + {formatUSD(alaCarteResult.totalMensual)} add-ons = {formatUSD(totalMensualConAddons)}
            </p>
          )}
        </div>

        <Separator />

        {/* Total Contrato */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <FileText className="h-3 w-3" />
            Total Contrato
          </div>
          <p className="text-xl font-bold text-foreground">
            {formatUSD(planResult.facturaTotal)}
          </p>
          {alaCarteResult.totalMensual > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Con add-ons: {formatUSD(totalContratoConAddons)}
            </p>
          )}
        </div>

        <Separator />

        {/* Utilidad y Comisiones */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Utilidad Bruta (Arche)</span>
            <span className="text-sm font-semibold">{formatUSD(planResult.utilidadBrutaMensual)}/mes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Margen</span>
            <Badge className={`${margenColor} text-xs`}>
              {formatPercent(planResult.margenPorcentaje)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Comisión Ventas</span>
            <span className="text-sm font-medium">{formatUSD(planResult.comisionVentasUSD)}/mes</span>
          </div>
          {planResult.comisionSignerUSD > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Comisión Firmante</span>
              <span className="text-sm font-medium">{formatUSD(planResult.comisionSignerUSD)}/mes</span>
            </div>
          )}
        </div>

        {/* Advertencias */}
        {warnings.length > 0 && (
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
