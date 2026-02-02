import { Outlet, Link } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-emerald-400">
            MosqOS
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-emerald-400">
              Login
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} MosqOS. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
