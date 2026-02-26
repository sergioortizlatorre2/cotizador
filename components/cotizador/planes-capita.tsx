'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Check, Shield, ShieldPlus, ShieldCheck } from 'lucide-react'
import type { PlanResult, PlanType, QuoteMode, Segmento } from '@/lib/cotizador/types'
import { formatUSD } from '@/lib/cotizador/calculos'
import { useRole } from '@/lib/auth/useRole'

interface PlanesCapitaProps {
  planes: Record<PlanType, PlanResult>
  modo: QuoteMode
  planSeleccionado: PlanType | null
  onSelectPlan: (plan: PlanType | null) => void

  // Para mostrar fee "amigable" en Municipio/Cooperativa
  segmento: Segmento
  poblacion: number
  incidenciaMensual: number
}

const PLAN_CONFIG: Record<
  PlanType,
  {
    label: string
    description: string
    includes: string[]
    icon: typeof Shield
    gradient: string
    borderColor: string
  }
> = {
  BASE: {
    label: 'BASE',
    description: 'Mantenimiento + Telemed + FaceScan',
    includes: ['Mantenimiento plataforma', 'Telemedicina incluida', 'FaceScan incluido'],
    icon: Shield,
    gradient: 'from-muted/50 to-muted/20',
    borderColor: 'border-border',
  },
  PLUS: {
    label: 'PLUS',
    description: 'BASE + Médico Capitado',
    includes: ['Todo lo de BASE', 'Médico capitado por vida', 'Cobertura médica mensual'],
    icon: ShieldPlus,
    gradient: 'from-primary/5 to-primary/0',
    borderColor: 'border-primary/30',
  },
  FULL: {
    label: 'FULL',
    description: 'PLUS + Accidentes Personales',
    includes: ['Todo lo de PLUS', 'Accidentes Personales (AP)', 'Cobertura integral'],
    icon: ShieldCheck,
    gradient: 'from-primary/10 to-primary/5',
    borderColor: 'border-primary',
  },
}

function MetricRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-right leading-snug whitespace-nowrap">
        {value}
      </p>
    </div>
  )
}

function isActuarialSegment(seg: Segmento) {
  return seg === 'municipio' || seg === 'cooperativa'
}

/** Tarjeta individual de plan */
function PlanCard({
  planType,
  result,
  isSelected,
  onSelect,
  disabled,
  segmento,
  poblacion,
  incidenciaMensual,
}: {
  planType: PlanType
  result: PlanResult
  isSelected: boolean
  onSelect: () => void
  disabled: boolean

  segmento: Segmento
  poblacion: number
  incidenciaMensual: number
}) {
  const role = useRole()
  const showArche = role === 'admin'

  const config = PLAN_CONFIG[planType]
  const Icon = config.icon

  const actuarial = isActuarialSegment(segmento)
  const pop = Math.max(0, poblacion)
  const inc = Math.max(0, Math.min(1, incidenciaMensual))
  const vidasCobradas = actuarial ? pop * inc : pop

  // Fee visible:
  // - Empresa/Otro: fee per cápita real
  // - Municipio/Cooperativa: mostrar fee "por vida total" = factura / población total
  const feeVisible =
    actuarial && pop > 0
      ? result.ingresoMensualConDescuento / pop
      : result.feePerCapita

  const feeLabel = actuarial ? 'Fee por vida total / mes' : 'Per Cápita / mes'

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
        {/* Fee principal */}
        <div className="rounded-xl bg-background/80 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">{feeLabel}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums whitespace-nowrap">
            {formatUSD(feeVisible)}
          </p>

          {actuarial && (
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
              Se factura el {Math.round(inc * 100)}% ({Math.round(vidasCobradas).toLocaleString('en-US')} vidas).
              Fee sobre vidas cobradas: <b>{formatUSD(result.feePerCapita)}</b>
            </p>
          )}
        </div>

        {/* Métricas */}
        <div className="rounded-xl border bg-background/70 p-3 flex flex-col gap-2 min-w-0">
          <MetricRow label="Factura mensual" value={formatUSD(result.ingresoMensualConDescuento)} />
          <MetricRow label="Total contrato" value={formatUSD(result.facturaTotal)} />

          {showArche && (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Utilidad bruta (Arche)</p>
                <p className="text-sm font-semibold tabular-nums leading-snug whitespace-nowrap">
                  {formatUSD(result.utilidadBrutaMensual)}{' '}
                  <span className="text-xs text-muted-foreground">/mes</span>
                </p>
              </div>
              <Badge className="text-xs flex-shrink-0" variant="secondary">
                {(result.margenPorcentaje * 100).toFixed(1)}%
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Incluidos */}
        <div className="flex flex-col gap-1.5">
          {config.includes.map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">{item}</span>
            </div>
          ))}
        </div>

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

export function PlanesCapita({
  planes,
  modo,
  planSeleccionado,
  onSelectPlan,
  segmento,
  poblacion,
  incidenciaMensual,
}: PlanesCapitaProps) {
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
            segmento={segmento}
            poblacion={poblacion}
            incidenciaMensual={incidenciaMensual}
          />
        ))}
      </div>
    </div>
  )
}
