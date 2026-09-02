import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <div className="text-5xl">🔍</div>
      <h2 className="mt-4 text-xl font-semibold text-slate-800">Página no encontrada</h2>
      <p className="mt-2 text-slate-600">
        La ruta que buscás no existe. Volvé al inicio para gestionar tu stock.
      </p>
      <Link
        to="/dashboard"
        className="mt-5 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Ir al Dashboard
      </Link>
    </section>
  )
}