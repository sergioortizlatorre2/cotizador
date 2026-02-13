'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Video, ScanFace, Bot, Plus, Trash2, Info } from 'lucide-react'
import type { QuoteState, AlaCarteResult } from '@/lib/cotizador/types'
import type { QuoteAction } from '@/lib/cotizador/store'
import {
  FACESCAN_TIERS,
  ZENTIS_TIERS,
  ZENTIS_IMAGENES_PRECIO,
  ZENTIS_TRANSCRIPCION_PRECIO,
} from '@/lib/cotizador/constants'
import { formatUSD, getTelemedAlaCartePrice, getFaceScanTierPrice, getZentisTierPrice } from '@/lib/cotizador/calculos'

interface ALaCartaProps {
  state: QuoteState
  dispatch: React.Dispatch<QuoteAction>
  result: AlaCarteResult
}

/** Tab de A la Carta (Upsells) */
export function ALaCarta({ state, dispatch, result }: ALaCartaProps) {
  const { alaCartaTelemed, alaCartaFaceScan, alaCartaZentis } = state

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">A la Carta</h2>
        <p className="text-sm text-muted-foreground">
          Agrega paquetes adicionales de servicios fuera del plan base seleccionado.
        </p>
      </div>

      {/* --- Telemed Packages --- */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-4 w-4 text-primary" />
              Paquetes de Telemedicina
            </CardTitle>
            <Switch
              checked={alaCartaTelemed.enabled}
              onCheckedChange={(v) => dispatch({ type: 'SET_ALC_TELEMED_ENABLED', payload: v })}
            />
          </div>
        </CardHeader>
        {alaCartaTelemed.enabled && (
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Cantidad por mes</Label>
              <Input
                type="number"
                min={0}
                value={alaCartaTelemed.cantidadMensual}
                onChange={(e) =>
                  dispatch({ type: 'SET_ALC_TELEMED_CANTIDAD', payload: parseInt(e.target.value) || 0 })
                }
                className="mt-1"
              />
            </div>

            {/* Tabla de tiers editable */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">
                  Tiers de volumen
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 inline ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Define rangos de precios por volumen. El sistema selecciona automáticamente el tier correspondiente.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const newTiers = [
                      ...alaCartaTelemed.tiers,
                      { minQty: (alaCartaTelemed.tiers[alaCartaTelemed.tiers.length - 1]?.minQty || 0) + 100, precioUnitario: 10 },
                    ]
                    dispatch({ type: 'SET_ALC_TELEMED_TIERS', payload: newTiers })
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar tier
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Min. Cantidad</TableHead>
                    <TableHead className="text-xs">Precio Unitario (USD)</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alaCartaTelemed.tiers.map((tier, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={tier.minQty}
                          onChange={(e) => {
                            const newTiers = [...alaCartaTelemed.tiers]
                            newTiers[i] = { ...newTiers[i], minQty: parseInt(e.target.value) || 0 }
                            dispatch({ type: 'SET_ALC_TELEMED_TIERS', payload: newTiers })
                          }}
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          value={tier.precioUnitario}
                          onChange={(e) => {
                            const newTiers = [...alaCartaTelemed.tiers]
                            newTiers[i] = { ...newTiers[i], precioUnitario: parseFloat(e.target.value) || 0 }
                            dispatch({ type: 'SET_ALC_TELEMED_TIERS', payload: newTiers })
                          }}
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        {alaCartaTelemed.tiers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              const newTiers = alaCartaTelemed.tiers.filter((_, j) => j !== i)
                              dispatch({ type: 'SET_ALC_TELEMED_TIERS', payload: newTiers })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Resumen */}
            <div className="rounded-xl bg-primary/5 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Precio unitario aplicado</p>
                <p className="text-sm font-semibold">{formatUSD(result.telemedUnitPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total mensual</p>
                <p className="text-lg font-bold text-primary">{formatUSD(result.telemedTotal)}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* --- FaceScan Packages --- */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanFace className="h-4 w-4 text-primary" />
              Paquetes de FaceScan
            </CardTitle>
            <Switch
              checked={alaCartaFaceScan.enabled}
              onCheckedChange={(v) => dispatch({ type: 'SET_ALC_FACESCAN_ENABLED', payload: v })}
            />
          </div>
        </CardHeader>
        {alaCartaFaceScan.enabled && (
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Scans esperados por año</Label>
              <Input
                type="number"
                min={0}
                value={alaCartaFaceScan.scansAnuales}
                onChange={(e) =>
                  dispatch({ type: 'SET_ALC_FACESCAN_SCANS', payload: parseInt(e.target.value) || 0 })
                }
                className="mt-1"
              />
            </div>

            {/* Tabla de referencia de tiers */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Tabla de precios por volumen</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Scans/Año</TableHead>
                    <TableHead className="text-xs">Precio Venta (USD)</TableHead>
                    <TableHead className="text-xs">Costo Base (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FACESCAN_TIERS.map((tier, i) => {
                    const isActive = alaCartaFaceScan.scansAnuales >= tier.minScans &&
                      (i === FACESCAN_TIERS.length - 1 || alaCartaFaceScan.scansAnuales < FACESCAN_TIERS[i + 1].minScans)
                    return (
                      <TableRow key={i} className={isActive ? 'bg-primary/5 font-medium' : ''}>
                        <TableCell className="text-xs">
                          {tier.minScans === 0 ? '1' : tier.minScans.toLocaleString()}+
                          {isActive && <Badge variant="outline" className="ml-2 text-[10px] border-primary text-primary">Activo</Badge>}
                        </TableCell>
                        <TableCell className="text-xs">{formatUSD(tier.precioUnitario)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatUSD(tier.precioUnitario / 2)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Resumen */}
            <div className="rounded-xl bg-primary/5 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Precio unitario (tier)</p>
                <p className="text-sm font-semibold">{formatUSD(result.faceScanUnitPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total mensual</p>
                <p className="text-lg font-bold text-primary">{formatUSD(result.faceScanTotal)}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* --- Zentis Licensing --- */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-primary" />
              Zentis Assistant
            </CardTitle>
            <Switch
              checked={alaCartaZentis.enabled}
              onCheckedChange={(v) => dispatch({ type: 'SET_ALC_ZENTIS_ENABLED', payload: v })}
            />
          </div>
        </CardHeader>
        {alaCartaZentis.enabled && (
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Usuarios activos / mes</Label>
              <Input
                type="number"
                min={1}
                value={alaCartaZentis.usuariosActivos}
                onChange={(e) =>
                  dispatch({ type: 'SET_ALC_ZENTIS_USUARIOS', payload: parseInt(e.target.value) || 1 })
                }
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Precio por usuario: {formatUSD(getZentisTierPrice(alaCartaZentis.usuariosActivos))}
              </p>
            </div>

            {/* Tabla de referencia Zentis */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Usuarios</TableHead>
                  <TableHead className="text-xs">Precio/Usuario/Mes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ZENTIS_TIERS.map((tier, i) => {
                  const isActive = alaCartaZentis.usuariosActivos >= tier.minUsers &&
                    alaCartaZentis.usuariosActivos <= tier.maxUsers
                  return (
                    <TableRow key={i} className={isActive ? 'bg-primary/5 font-medium' : ''}>
                      <TableCell className="text-xs">
                        {tier.minUsers}–{tier.maxUsers === Infinity ? '...' : tier.maxUsers}
                        {isActive && <Badge variant="outline" className="ml-2 text-[10px] border-primary text-primary">Activo</Badge>}
                      </TableCell>
                      <TableCell className="text-xs">{formatUSD(tier.precioUsuario)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <Separator />

            {/* Módulos opcionales */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Módulos Opcionales</p>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Zentis para Imágenes</Label>
                  <p className="text-xs text-muted-foreground">{formatUSD(ZENTIS_IMAGENES_PRECIO)}/usuario/mes</p>
                </div>
                <Switch
                  checked={alaCartaZentis.zentisImagenes}
                  onCheckedChange={(v) => dispatch({ type: 'SET_ALC_ZENTIS_IMAGENES', payload: v })}
                />
              </div>
              {alaCartaZentis.zentisImagenes && (
                <div className="pl-4">
                  <Label className="text-xs text-muted-foreground">Usuarios con imágenes</Label>
                  <Input
                    type="number"
                    min={1}
                    value={alaCartaZentis.zentisImagenesUsuarios}
                    onChange={(e) =>
                      dispatch({ type: 'SET_ALC_ZENTIS_IMAGENES_USUARIOS', payload: parseInt(e.target.value) || 1 })
                    }
                    className="mt-1 h-8"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Transcripción de consultas</Label>
                  <p className="text-xs text-muted-foreground">{formatUSD(ZENTIS_TRANSCRIPCION_PRECIO)}/transcripción</p>
                </div>
                <Switch
                  checked={alaCartaZentis.transcripciones}
                  onCheckedChange={(v) => dispatch({ type: 'SET_ALC_ZENTIS_TRANSCRIPCIONES', payload: v })}
                />
              </div>
              {alaCartaZentis.transcripciones && (
                <div className="pl-4">
                  <Label className="text-xs text-muted-foreground">Transcripciones / mes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={alaCartaZentis.transcripcionesCantidad}
                    onChange={(e) =>
                      dispatch({ type: 'SET_ALC_ZENTIS_TRANSCRIPCIONES_CANTIDAD', payload: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1 h-8"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Integraciones</Label>
                  <p className="text-xs text-muted-foreground">Personalizado / TBD</p>
                </div>
                <Switch
                  checked={alaCartaZentis.integraciones}
                  onCheckedChange={(v) => dispatch({ type: 'SET_ALC_ZENTIS_INTEGRACIONES', payload: v })}
                />
              </div>
              {alaCartaZentis.integraciones && (
                <div className="pl-4">
                  <Label className="text-xs text-muted-foreground">Notas</Label>
                  <Textarea
                    value={alaCartaZentis.integracionesNota}
                    onChange={(e) =>
                      dispatch({ type: 'SET_ALC_ZENTIS_INTEGRACIONES_NOTA', payload: e.target.value })
                    }
                    placeholder="Detalle de integraciones requeridas..."
                    className="mt-1 text-xs"
                    rows={2}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Resumen Zentis */}
            <div className="rounded-xl bg-primary/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Assistant</span>
                <span className="text-sm font-medium">{formatUSD(result.zentisDesglose.assistantMensual)}/mes</span>
              </div>
              {result.zentisDesglose.imagenesMensual > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Imágenes</span>
                  <span className="text-sm font-medium">{formatUSD(result.zentisDesglose.imagenesMensual)}/mes</span>
                </div>
              )}
              {result.zentisDesglose.transcripcionesMensual > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Transcripciones</span>
                  <span className="text-sm font-medium">{formatUSD(result.zentisDesglose.transcripcionesMensual)}/mes</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Total Zentis</span>
                <span className="text-lg font-bold text-primary">{formatUSD(result.zentisTotal)}/mes</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Resumen total a la carta */}
      {result.totalMensual > 0 && (
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Total Add-ons Mensual</p>
                <p className="text-xs text-muted-foreground">Se suma a la factura del plan seleccionado</p>
              </div>
              <p className="text-2xl font-bold text-primary">{formatUSD(result.totalMensual)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
