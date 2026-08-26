import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CloseIcon,
  CategoriesIcon,
  ClientsIcon,
  DashboardIcon,
  MenuIcon,
  MovementsIcon,
  ProductsIcon,
  SuppliersIcon,
  TrashIcon,
} from '@/components/icons'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/products', label: 'Productos', icon: ProductsIcon },
  { to: '/suppliers', label: 'Proveedores', icon: SuppliersIcon },
  { to: '/clients', label: 'Clientes', icon: ClientsIcon },
  { to: '/categories', label: 'Categorías', icon: CategoriesIcon },
  { to: '/movements', label: 'Movimientos', icon: MovementsIcon },
  { to: '/trash', label: 'Papelera', icon: TrashIcon },
]

function Brand() {
  return (
    <div className="flex items-center gap-2 px-4 py-4">
      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">
        LC
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-slate-900">La Cucha</p>
        <p className="text-xs text-slate-500">Gestión de stock</p>
      </div>
    </div>
  )
}

function Menu() {
  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Navegación principal">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )
          }
        >
          <Icon className="size-5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <button
      onClick={() => {
        logout()
        navigate('/login', { replace: true })
      }}
      className="mx-3 mb-4 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
    >
      Cerrar sesión
    </button>
  )
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <Brand />
        <Menu />
        <div className="mt-auto">
          <LogoutButton />
        </div>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <Menu />
            <div className="mt-auto">
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="rounded-md p-1.5 text-slate-700 hover:bg-slate-100"
        >
          <MenuIcon className="size-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-emerald-600 text-xs font-black text-white">
            LC
          </div>
          <span className="text-sm font-bold text-slate-900">La Cucha</span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}