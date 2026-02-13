'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Check,
  Shield,
  ShieldPlus,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react'
import type { PlanResult, PlanType, QuoteMode } from '@/lib/cotizador/types'
import { formatUSD, formatPercent } from '@/lib/cotizador/calculos'

interface PlanesCapitaProps {
  planes: Record<PlanType, PlanResult>
  modo: QuoteMode
  planSeleccionado: PlanType | null
  onSelectPlan: (plan: PlanType | null) => void
}

const PLAN_CONFIG: Record<PlanType, {
  label: string
  description: string
  includes: string[]
  icon: typeof Shield
  gradient: string
  borderColor: string
}> = {
  BASE: {
    label: 'BASE',
    description: 'Mantenimiento + Telemed + FaceScan',
    includes: [
      'Mantenimiento plataforma',
      'Telemedicina incluida',
      'FaceScan incluido',
    ],
    icon: Shield,
    gradient: 'from-muted/50 to-muted/20',
    borderColor: 'border-border',
  },
  PLUS: {
    label: 'PLUS',
    description: 'BASE + Médico Capitado',
    includes: [
      'Todo lo de BASE',
      'Médico capitado por vida',
      'Cobertura médica mensual',
    ],
    icon: ShieldPlus,
    gradient: 'from-primary/5 to-primary/0',
    borderColor: 'border-primary/30',
  },
  FULL: {
    label: 'FULL',
    description: 'PLUS + Accidentes Personales',
    includes: [
      'Todo lo de PLUS',
      'Accidentes Personales (AP)',
      'Cobertura integral',
    ],
    icon: ShieldCheck,
    gradient: 'from-primary/10 to-primary/5',
    borderColor: 'border-primary',
  },
}

/** Tarjeta individual de plan */
function PlanCard({
  planType,
  result,
  isSelected,
  onSelect,
  disabled,
}: {
  planType: PlanType
  result: PlanResult
  isSelected: boolean
  onSelect: () => void
  disabled: boolean
}) {
  const config = PLAN_CONFIG[planType]
  const Icon = config.icon

  const margenColor =
    result.margenPorcentaje < 0
      ? 'bg-destructive text-destructive-foreground'
      : result.margenPorcentaje < 0.15
        ? 'bg-warning text-warning-foreground'
        : 'bg-success text-success-foreground'

  const hasOverage = result.excedenteTelemed > 0 || result.excedenteFaceScan > 0

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        disabled
          ? 'border opacity-50'
          : isSelected
            ? `${config.borderColor} border-2 shadow-lg ring-2 ring-primary/20`
            : 'border hover:shadow-md cursor-pointer'
      }`}
      onClick={() => {
        if (!disabled) onSelect()
      }}
    >
      {/* Gradiente de fondo */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`} />

      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        </div>
      )}

      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{config.label}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </CardHeader>

      <CardContent className="relative flex flex-col gap-3">
        {/* Per Cápita - tipografía grande */}
        <div className="rounded-xl bg-background/80 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Per Cápita / mes</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {formatUSD(result.feePerCapita)}
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Factura Mensual</p>
            <p className="text-sm font-semibold">{formatUSD(result.ingresoMensualConDescuento)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Contrato</p>
            <p className="text-sm font-semibold">{formatUSD(result.facturaTotal)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Utilidad Bruta</p>
            <p className="text-sm font-semibold">{formatUSD(result.utilidadBrutaMensual)}/mes</p>
          </div>
          <Badge className={`${margenColor} text-xs`}>
            {formatPercent(result.margenPorcentaje)}
          </Badge>
        </div>

        <Separator />

        {/* Incluidos */}
        <div className="flex flex-col gap-1.5">
          {config.includes.map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-primary flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        {/* Indicador de excedentes */}
        {hasOverage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-2 cursor-help">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                  <span className="text-xs text-warning font-medium">
                    Riesgo de excedente
                  </span>
                  <Info className="h-3 w-3 text-warning/60 ml-auto" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                <p>
                  Excedente estimado (no facturado):
                  {result.excedenteTelemed > 0 && ` ${Math.round(result.excedenteTelemed)} telemed`}
                  {result.excedenteFaceScan > 0 && ` / ${Math.round(result.excedenteFaceScan)} scans`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Botón de selección */}
        <Button
          variant={isSelected ? 'default' : 'outline'}
          size="sm"
          className="w-full mt-1"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) onSelect()
          }}
        >
          {disabled ? 'No aplica en este modo' : isSelected ? 'Plan Seleccionado' : 'Seleccionar Plan'}
        </Button>
      </CardContent>
    </Card>
  )
}

/** Tab de Planes por Cápita */
export function PlanesCapita({ planes, modo, planSeleccionado, onSelectPlan }: PlanesCapitaProps) {
  const disabled = modo === 'SOLO_PAQUETES'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Planes por Cápita</h2>
        <p className="text-sm text-muted-foreground">
          Compara los tres niveles de plan y selecciona el que mejor se adapte a tu cliente.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant={planSeleccionado ? 'outline' : 'default'}
            size="sm"
            disabled={disabled}
            onClick={() => onSelectPlan(null)}
          >
            Sin plan
          </Button>
        </div>

        {disabled && (
          <p className="mt-2 text-sm text-muted-foreground">
            Estás en <b>Solo Paquetes</b>. Los planes quedan desactivados para evitar sumas automáticas.
          </p>
        )}

      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(['BASE', 'PLUS', 'FULL'] as PlanType[]).map((pt) => (
          <PlanCard
            key={pt}
            planType={pt}
            result={planes[pt]}
            isSelected={planSeleccionado === pt}
            onSelect={() => onSelectPlan(pt)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
