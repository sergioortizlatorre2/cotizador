'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, Trash2, FileEdit, Clock } from 'lucide-react'
import type { QuoteState, SavedQuote } from '@/lib/cotizador/types'
import type { QuoteAction } from '@/lib/cotizador/store'
import { toast } from 'sonner'

interface AjustesProps {
  state: QuoteState
  dispatch: React.Dispatch<QuoteAction>
  savedQuotes: SavedQuote[]
  onLoadQuote: (quote: SavedQuote) => void
  onDeleteQuote: (id: string) => void
  onReset: () => void
}

/** Tab de Ajustes */
export function Ajustes({
  state,
  dispatch,
  savedQuotes,
  onLoadQuote,
  onDeleteQuote,
  onReset,
}: AjustesProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Ajustes</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona cotizaciones guardadas y configura el cotizador.
        </p>
      </div>

      {/* Nombre de la cotización */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileEdit className="h-4 w-4 text-primary" />
            Cotización Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Nombre de la cotización</Label>
            <Input
              value={state.quoteName}
              onChange={(e) => dispatch({ type: 'SET_QUOTE_NAME', payload: e.target.value })}
              placeholder="Nombre descriptivo..."
              className="mt-1"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onReset}
            className="w-fit gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar cotización
          </Button>
        </CardContent>
      </Card>

      {/* Cotizaciones guardadas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            Cotizaciones Guardadas
            <Badge variant="outline" className="ml-auto text-xs">
              {savedQuotes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay cotizaciones guardadas. Usa el botón {'"Guardar"'} en la pestaña Resumen.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {savedQuotes.map((sq) => (
                <div
                  key={sq.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{sq.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{sq.state.contrato.nombreCliente || '(Sin cliente)'}</span>
                      <span>|</span>
                      <span>{sq.state.planSeleccionado}</span>
                      <span>|</span>
                      <span>{new Date(sq.timestamp).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onLoadQuote(sq)}
                    >
                      Cargar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onDeleteQuote(sq.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info del app */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-sm">Arche Salud - Cotizador Comercial v1.0</p>
            <p>Herramienta de uso interno para representantes de ventas.</p>
            <p>Los datos se almacenan localmente en el navegador.</p>
            <p>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
