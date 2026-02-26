'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AppRole } from '@/lib/auth/role'
import { clearRole, getRole, roleFromPassword, setRole } from '@/lib/auth/role'

function roleLabel(role: AppRole) {
  if (role === 'admin') return 'Arche'
  if (role === 'sales') return 'Vendedor'
  return 'Público'
}

export function RoleSwitcher() {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [role, setRoleState] = useState<AppRole>(() => getRole())

  const label = useMemo(() => roleLabel(role), [role])

  const login = () => {
    const r = roleFromPassword(pw)
    if (!r) return
    setRole(r)
    setRoleState(r)
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
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        Modo: <span className="ml-2"><Badge variant="secondary">{label}</Badge></span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-1/2 top-24 w-[92vw] max-w-md -translate-x-1/2">
            <Card className="shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cambiar modo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground leading-snug">
                  Público oculta comisiones y márgenes internos. Vendedor muestra su comisión.
                  Arche muestra toda la información.
                </p>

                <Input
                  type="password"
                  placeholder="Ingresá clave"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') login()
                  }}
                />

                <div className="flex gap-2">
                  <Button onClick={login} disabled={!pw.trim()}>
                    Entrar
                  </Button>
                  <Button variant="ghost" onClick={logout}>
                    Salir (Público)
                  </Button>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  admin2026 = Arche · sales2026 = Vendedor
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
