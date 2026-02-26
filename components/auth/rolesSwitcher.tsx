'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AppRole } from '../../lib/auth/role'
import {
  clearRole,
  getRole,
  roleFromPassword,
  setRole,
  ROLE_EVENT_NAME,
} from '../../lib/auth/role'

function roleLabel(role: AppRole) {
  if (role === 'admin') return 'Arche'
  if (role === 'sales') return 'Vendedor'
  return 'Público'
}

export function RoleSwitcher() {
  const [pw, setPw] = useState('')
  const [open, setOpen] = useState(false)

  // ✅ SSR-safe: no leer sessionStorage en el render inicial
  const [role, setRoleState] = useState<AppRole>('public')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setRoleState(getRole())

    const handler = () => {
      setRoleState(getRole())
    }

    window.addEventListener(ROLE_EVENT_NAME, handler)
    return () => window.removeEventListener(ROLE_EVENT_NAME, handler)
  }, [])

  const label = useMemo(() => roleLabel(role), [role])

  const login = () => {
    const resolvedRole = roleFromPassword(pw.trim())
    if (!resolvedRole) return

    setRole(resolvedRole)
    setRoleState(resolvedRole)
    setPw('')
    setOpen(false)
  }

  const logout = () => {
    clearRole()
    setRoleState('public')
    setPw('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <span>Modo:</span>
        <span className="ml-2">
          {/* ✅ mismo texto en server y primer render cliente */}
          <Badge variant="secondary">{mounted ? label : 'Público'}</Badge>
        </span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">Cambiar modo</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Público oculta comisiones y márgenes internos. Vendedor muestra su comisión.
                Arche muestra todo.
              </p>

              <Input
                type="password"
                placeholder="Ingresá clave"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />

              <div className="flex gap-2">
                <Button onClick={login} disabled={!pw.trim()}>
                  Entrar
                </Button>

                <Button variant="ghost" onClick={logout}>
                  Salir (Público)
                </Button>

                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Claves: admin2026 (Arche), sales2026 (Vendedor)
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}