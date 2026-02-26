'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Building2, Settings2, DollarSign, Percent, Info, Zap } from 'lucide-react'
import type { QuoteState, Segmento, IncidenciaPreset, QuoteMode } from '@/lib/cotizador/types'
import type { QuoteAction } from '@/lib/cotizador/store'
import { INCIDENCIA_PRESETS } from '@/lib/cotizador/constants'
import { useRole } from '../../lib/auth/useRole'

interface PanelControlProps {
  state: QuoteState
  dispatch: React.Dispatch<QuoteAction>
}

function normalizeIncidence(value: number) {
  if (!Number.isFinite(value)) return 0
  return value > 1 ? value / 100 : value
}

function FieldTip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
  tip,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  tip?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Label className="text-sm">{label}</Label>
        {tip && <FieldTip text={tip} />}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function PanelControl({ state, dispatch }: PanelControlProps) {
  const { contrato, planDesign, costosBase, preciosComisiones } = state
  const role = useRole()
  const canSeeInternalPricing = role === 'admin'

  const isActuarial = contrato.segmento === 'municipio' || contrato.segmento === 'cooperativa'

  const [poblacionDraft, setPoblacionDraft] = React.useState(() => String(contrato.poblacion ?? 0))
  const [duracionDraft, setDuracionDraft] = React.useState(() => String(contrato.duracionMeses ?? 1))

  React.useEffect(() => {
    setPoblacionDraft(String(contrato.poblacion ?? 0))
  }, [contrato.poblacion])

  React.useEffect(() => {
    setDuracionDraft(String(contrato.duracionMeses ?? 1))
  }, [contrato.duracionMeses])

  const normalizeDigits = (s: string) => {
    const digits = s.replace(/[^\d]/g, '')
    return digits.replace(/^0+(?=\d)/, '')
  }

  const currentPreset = (Object.entries(INCIDENCIA_PRESETS) as [IncidenciaPreset, number][])
    .find(([, raw]) => {
      const v = normalizeIncidence(raw)
      return Math.abs(v - planDesign.incidenciaMensual) < 0.001
    })?.[0]

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Modo de Cotización
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">
            Elegí cómo se arma el precio: plan por cápita o solo paquetes
          </Label>
          <Select
            value={state.modo}
            onValueChange={(v) => dispatch({ type: 'SET_MODO', payload: v as QuoteMode })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLANES">Planes (por cápita) + Paquetes opcionales</SelectItem>
              <SelectItem value="SOLO_PAQUETES">Solo Paquetes (Telemed / FaceScan / Zentis)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            Contrato y Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Nombre del cliente</Label>
            <Input
              placeholder="Nombre del cliente o entidad"
              value={contrato.nombreCliente}
              onChange={(e) => dispatch({ type: 'SET_NOMBRE_CLIENTE', payload: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Segmento</Label>
            <Select
              value={contrato.segmento}
              onValueChange={(v) => dispatch({ type: 'SET_SEGMENTO', payload: v as Segmento })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="municipio">Municipio</SelectItem>
                <SelectItem value="cooperativa">Cooperativa</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Población (vidas)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={poblacionDraft}
                onChange={(e) => {
                  const cleaned = normalizeDigits(e.target.value)
                  setPoblacionDraft(cleaned)
                  const n = parseInt(cleaned || '0', 10)
                  dispatch({ type: 'SET_POBLACION', payload: n })
                }}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Duración (meses)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={duracionDraft}
                onChange={(e) => {
                  const cleaned = normalizeDigits(e.target.value)
                  setDuracionDraft(cleaned)
                  const n = Math.max(1, parseInt(cleaned || '1', 10))
                  dispatch({ type: 'SET_DURACION_MESES', payload: n })
                }}
                className="mt-1"
              />
            </div>
          </div>

          <ToggleField
            label="Start Fee"
            checked={contrato.startFeeEnabled}
            onChange={(v) => dispatch({ type: 'SET_START_FEE_ENABLED', payload: v })}
            tip="Cargo inicial único al firmar el contrato."
          />
          {contrato.startFeeEnabled && (
            <div>
              <Label className="text-xs text-muted-foreground">Monto Start Fee (USD)</Label>
              <Input
                type="number"
                min={0}
                value={contrato.startFeeAmount}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_START_FEE_AMOUNT',
                    payload: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            </div>
          )}

          <ToggleField
            label="Reserva"
            checked={contrato.reservaEnabled}
            onChange={(v) => dispatch({ type: 'SET_RESERVA_ENABLED', payload: v })}
            tip="Fondo de reserva prorrateado mensualmente."
          />
          {contrato.reservaEnabled && (
            <div>
              <Label className="text-xs text-muted-foreground">Meses de reserva (0-3)</Label>
              <Slider
                min={0}
                max={3}
                step={1}
                value={[contrato.reservaMeses]}
                onValueChange={([v]) => dispatch({ type: 'SET_RESERVA_MESES', payload: v })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {contrato.reservaMeses} mes(es)
              </p>
            </div>
          )}

          <ToggleField
            label="Firmante (Signer)"
            checked={contrato.signerEnabled}
            onChange={(v) => dispatch({ type: 'SET_SIGNER_ENABLED', payload: v })}
            tip="Si está activo, se aplica la comisión del firmante sobre el ingreso."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Presets Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(INCIDENCIA_PRESETS) as [IncidenciaPreset, number][]).map(
              ([name, rawValue]) => {
                const value = normalizeIncidence(rawValue)
                return (
                  <Badge
                    key={name}
                    variant={currentPreset === name ? 'default' : 'outline'}
                    className="cursor-pointer capitalize text-xs"
                    onClick={() => dispatch({ type: 'SET_INCIDENCIA', payload: value })}
                  >
                    {name} ({(value * 100).toFixed(0)}%)
                  </Badge>
                )
              }
            )}
          </div>

          <p className="text-[11px] text-muted-foreground leading-snug">
            {isActuarial ? (
              <>
                En <b>Municipio/Cooperativa</b>, el preset define el <b>% de población facturable</b>. Se factura sobre ese porcentaje, no sobre el total de vidas.
              </>
            ) : (
              <>
                En <b>Empresa</b>, el preset define la <b>incidencia de uso</b>. La facturación se hace sobre el total de vidas.
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings2 className="h-4 w-4 text-primary" />
            Diseño del Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                Telemed incluido/vida/mes
                <FieldTip text="Cantidad incluida por vida activa/mes." />
              </Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={planDesign.telemedIncluidoPorVida}
                onChange={(e) =>
                  dispatch({ type: 'SET_TELEMED_INCLUIDO', payload: parseFloat(e.target.value) || 0 })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                FaceScan incluido/vida/mes
                <FieldTip text="Cantidad incluida por vida activa/mes." />
              </Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={planDesign.faceScanIncluidoPorVida}
                onChange={(e) =>
                  dispatch({ type: 'SET_FACESCAN_INCLUIDO', payload: parseFloat(e.target.value) || 0 })
                }
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              {isActuarial
                ? `Población facturable: ${(planDesign.incidenciaMensual * 100).toFixed(0)}%`
                : `Incidencia mensual (uso): ${(planDesign.incidenciaMensual * 100).toFixed(0)}%`}
            </Label>
            <Slider
              min={0.01}
              max={0.4}
              step={0.01}
              value={[planDesign.incidenciaMensual]}
              onValueChange={([v]) => dispatch({ type: 'SET_INCIDENCIA', payload: v })}
              className="mt-2"
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="avanzado" className="border-none">
              <AccordionTrigger className="text-xs text-muted-foreground py-1 hover:no-underline">
                Avanzado
              </AccordionTrigger>
              <AccordionContent>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Scans por evento
                    <FieldTip text="Cantidad de face scans realizados por cada evento/consulta." />
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={planDesign.scansPorEvento}
                    onChange={(e) =>
                      dispatch({ type: 'SET_SCANS_POR_EVENTO', payload: parseInt(e.target.value) || 1 })
                    }
                    className="mt-1"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible>
        <AccordionItem value="costos" className="border rounded-xl overflow-hidden">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-0">
              <AccordionTrigger className="hover:no-underline py-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Costos Base (USD)
                </CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent>
              <CardContent className="flex flex-col gap-3 pt-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Costo base Telemed</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={costosBase.costoBaseTelemed}
                    onChange={(e) =>
                      dispatch({ type: 'SET_COSTO_TELEMED', payload: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Costo base FaceScan</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={costosBase.costoBaseFaceScan}
                    onChange={(e) =>
                      dispatch({ type: 'SET_COSTO_FACESCAN', payload: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mantenimiento / vida / mes</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={costosBase.mantenimientoPorVida}
                    onChange={(e) =>
                      dispatch({ type: 'SET_COSTO_MANTENIMIENTO', payload: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Médico capitado / vida / mes
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={costosBase.costoMedicoPorVida}
                    onChange={(e) =>
                      dispatch({ type: 'SET_COSTO_MEDICO', payload: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Accidentes Personales (AP) / vida / mes
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={costosBase.costoAPPorVida}
                    onChange={(e) =>
                      dispatch({ type: 'SET_COSTO_AP', payload: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      {canSeeInternalPricing && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Percent className="h-4 w-4 text-primary" />
              Precios y Comisiones
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Markup CORE
                  <FieldTip text="Multiplicador sobre el costo CORE para generar precio." />
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={0.1}
                  value={preciosComisiones.markupCore}
                  onChange={(e) =>
                    dispatch({ type: 'SET_MARKUP_CORE', payload: parseFloat(e.target.value) || 1 })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Margen AP (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(preciosComisiones.margenAP * 100)}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_MARGEN_AP',
                      payload: (parseFloat(e.target.value) || 0) / 100,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Comisión Ventas (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={Math.round(preciosComisiones.comisionVentas * 100)}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_COMISION_VENTAS',
                      payload: (parseFloat(e.target.value) || 0) / 100,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Comisión Firmante (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={Math.round(preciosComisiones.comisionSigner * 100)}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_COMISION_SIGNER',
                      payload: (parseFloat(e.target.value) || 0) / 100,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                Descuento Comercial: {(preciosComisiones.descuentoComercial * 100).toFixed(0)}%
              </Label>
              <Slider
                min={0}
                max={0.3}
                step={0.01}
                value={[preciosComisiones.descuentoComercial]}
                onValueChange={([v]) => dispatch({ type: 'SET_DESCUENTO_COMERCIAL', payload: v })}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}