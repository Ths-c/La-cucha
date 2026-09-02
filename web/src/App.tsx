import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { ProductFormPage } from '@/pages/ProductFormPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { SuppliersPage } from '@/pages/SuppliersPage'
import { SupplierFormPage } from '@/pages/SupplierFormPage'
import { SupplierDetailPage } from '@/pages/SupplierDetailPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { MovementsPage } from '@/pages/MovementsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { TrashPage } from '@/pages/TrashPage'
import { NotesPage } from '@/pages/NotesPage'
import { RequireAuth } from '@/features/auth/RequireAuth'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductFormPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/edit" element={<ProductFormPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/new" element={<SupplierFormPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/movements" element={<MovementsPage />} />
<Route path="/categories" element={<CategoriesPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="*" element={<HomePage />} />
        </Route>
      </Route>
    </Routes>
  )
}