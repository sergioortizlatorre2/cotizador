'use client'

import { RoleSwitcher } from '@/components/auth/rolesSwitcher'
import { useReducer, useMemo, useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { quoteReducer } from '@/lib/cotizador/store'
import { INITIAL_STATE } from '@/lib/cotizador/constants'
import {
  calcularTodosLosPlanes,
  calcularAlaCarte,
  calcularTotalesCotizacion,
} from '@/lib/cotizador/calculos'
import type { SavedQuote } from '@/lib/cotizador/types'
import { PanelControl } from '@/components/cotizador/panel-control'
import { ResultadosSidebar } from '@/components/cotizador/resultados-sidebar'
import { PlanesCapita } from '@/components/cotizador/planes-capita'
import { ALaCarta } from '@/components/cotizador/a-la-carta'
import { ResumenExport } from '@/components/cotizador/resumen-export'
import { Ajustes } from '@/components/cotizador/ajustes'
import { toast } from 'sonner'
import { Activity, BarChart3, ShoppingBag, Settings, FileText } from 'lucide-react'

const STORAGE_KEY = 'arche-cotizador-quotes'

function loadSavedQuotes(): SavedQuote[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSavedQuotes(quotes: SavedQuote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
}

export default function CotizadorPage() {
  // --- State ---
  const [state, dispatch] = useReducer(quoteReducer, INITIAL_STATE)
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([])
  const [activeTab, setActiveTab] = useState('planes')

  // Cargar cotizaciones guardadas y estado de URL
  useEffect(() => {
    setSavedQuotes(loadSavedQuotes())

    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(q)))
        dispatch({ type: 'LOAD_STATE', payload: decoded })
        toast.success('Cotización cargada desde enlace')
        window.history.replaceState({}, '', window.location.pathname)
      } catch {
        // ignorar
      }
    }
  }, [])

  // --- Cálculos (memoizados) ---
  const planes = useMemo(() => calcularTodosLosPlanes(state), [state])
  const alaCarteResult = useMemo(() => calcularAlaCarte(state), [state])

  const planActual = useMemo(() => {
    if (state.modo !== 'PLANES') return null
    if (!state.planSeleccionado) return null
    return planes[state.planSeleccionado]
  }, [planes, state.modo, state.planSeleccionado])

  const totales = useMemo(
    () => calcularTotalesCotizacion(state, planActual, alaCarteResult),
    [state, planActual, alaCarteResult]
  )

  // --- Warnings (guard rails) ---
  const warnings = useMemo(() => {
    const w: string[] = []
    if (planActual && planActual.margenPorcentaje < 0) {
      w.push('Margen negativo: el descuento o los costos superan el ingreso.')
    }
    const totalCom =
      state.preciosComisiones.comisionVentas +
      (state.contrato.signerEnabled ? state.preciosComisiones.comisionSigner : 0)
    if (totalCom >= 0.4) {
      w.push(`Comisiones altas: ${(totalCom * 100).toFixed(0)}% del ingreso.`)
    }
    if (state.planDesign.incidenciaMensual > 0.2) {
      w.push('Incidencia atípica: mayor al 20%.')
    }
    return w
  }, [
    planActual,
    state.preciosComisiones,
    state.contrato.signerEnabled,
    state.planDesign.incidenciaMensual,
  ])

  // --- Acciones de cotización ---
  const handleSave = useCallback(() => {
    const newQuote: SavedQuote = {
      id: crypto.randomUUID(),
      name: state.quoteName || `Cotización ${new Date().toLocaleDateString('es-ES')}`,
      state: { ...state },
      timestamp: Date.now(),
    }
    const updated = [newQuote, ...savedQuotes]
    setSavedQuotes(updated)
    saveSavedQuotes(updated)
    toast.success('Cotización guardada')
  }, [state, savedQuotes])

  const handleDuplicate = useCallback(() => {
    const newState = { ...state, quoteId: crypto.randomUUID(), quoteName: `${state.quoteName} (copia)` }
    dispatch({ type: 'LOAD_STATE', payload: newState })
    toast.success('Cotización duplicada')
  }, [state])

  const handleLoadQuote = useCallback((quote: SavedQuote) => {
    dispatch({ type: 'LOAD_STATE', payload: quote.state })
    toast.success(`Cotización "${quote.name}" cargada`)
  }, [])

  const handleDeleteQuote = useCallback(
    (id: string) => {
      const updated = savedQuotes.filter((q) => q.id !== id)
      setSavedQuotes(updated)
      saveSavedQuotes(updated)
      toast.success('Cotización eliminada')
    },
    [savedQuotes]
  )

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
    toast.success('Cotización reiniciada')
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">Arche Salud</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Cotizador Comercial</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">
              {state.contrato.nombreCliente ? state.contrato.nombreCliente : 'Sin cliente seleccionado'}
            </p>
            <RoleSwitcher />
          </div>
        </div>
      </header>

      {/* Main layout: ahora usa ancho real + grid */}
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)_360px]">
          {/* Left: Inputs */}
          <aside className="min-w-0">
            <div className="lg:sticky lg:top-6">
              {/* Altura fija para que siempre haya scroll en el panel */}
              <ScrollArea className="h-[calc(100vh-140px)] pr-3">
                <PanelControl state={state} dispatch={dispatch} />
              </ScrollArea>
            </div>
          </aside>

          {/* Center */}
          <div className="min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 w-full grid grid-cols-4">
                <TabsTrigger value="planes" className="gap-1.5 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Planes</span>
                </TabsTrigger>
                <TabsTrigger value="alacarta" className="gap-1.5 text-xs">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">A la Carta</span>
                </TabsTrigger>
                <TabsTrigger value="resumen" className="gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Resumen</span>
                </TabsTrigger>
                <TabsTrigger value="ajustes" className="gap-1.5 text-xs">
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ajustes</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="planes">
              <PlanesCapita
                planes={planes}
                modo={state.modo}
                planSeleccionado={state.planSeleccionado}
                onSelectPlan={(plan) => dispatch({ type: 'SET_PLAN_SELECCIONADO', payload: plan })}
                segmento={state.contrato.segmento}
                poblacion={state.contrato.poblacion}
                incidenciaMensual={state.planDesign.incidenciaMensual}
              />
              </TabsContent>

              <TabsContent value="alacarta">
                <ALaCarta state={state} dispatch={dispatch} result={alaCarteResult} />
              </TabsContent>

              <TabsContent value="resumen">
                <ResumenExport
                  state={state}
                  planResult={planActual}
                  alaCarteResult={alaCarteResult}
                  totales={totales}
                  onSave={handleSave}
                  onDuplicate={handleDuplicate}
                />
              </TabsContent>

              <TabsContent value="ajustes">
                <Ajustes
                  state={state}
                  dispatch={dispatch}
                  savedQuotes={savedQuotes}
                  onLoadQuote={handleLoadQuote}
                  onDeleteQuote={handleDeleteQuote}
                  onReset={handleReset}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Resultados */}
          <aside className="min-w-0">
            <div className="lg:sticky lg:top-6">
              <ResultadosSidebar
                planResult={planActual}
                alaCarteResult={alaCarteResult}
                totales={totales}
                modo={state.modo}
                planSeleccionado={state.planSeleccionado}
                warnings={warnings}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}