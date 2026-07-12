import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  FilePlus,
  Menu,
  Factory,
  Sun,
  Moon,
  LogOut,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/sales', label: 'Sales', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/vendors', label: 'Vendors', icon: Factory },
]

const inventorySubItems = [
  { path: '/inventory/receive-stock', label: 'Receive Stock', icon: PackagePlus },
]

const salesSubItems = [
  { path: '/sales/new', label: 'New Sale', icon: FilePlus },
]

function Layout() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) return saved === 'dark'
      return true // default to dark
    }
    return true
  })

  const location = useLocation()

  const isInventoryActive = location.pathname.startsWith('/inventory')
  const isSalesActive = location.pathname.startsWith('/sales')

  // Apply theme class
  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.add('light')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 h-full flex flex-col
          bg-surface-800 border-r border-surface-700
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className={`flex items-center h-16 px-4 border-b border-surface-700 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-slide-right">
              <h1 className="text-base font-bold text-surface-50 tracking-tight">HSP ERP</h1>
              <p className="text-[10px] text-surface-400 font-medium uppercase tracking-widest">Wholesale</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path ||
              (item.path === '/inventory' && isInventoryActive) ||
              (item.path === '/sales' && isSalesActive)

            return (
              <div key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 relative
                    ${isActive
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/60'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </NavLink>

                {/* Inventory sub-items */}
                {item.path === '/inventory' && isInventoryActive && !collapsed && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-surface-700 pl-3">
                    {inventorySubItems.map((sub) => {
                      const SubIcon = sub.icon
                      const isSubActive = location.pathname === sub.path
                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium
                            transition-all duration-200
                            ${isSubActive
                              ? 'text-primary-400 bg-primary-500/10'
                              : 'text-surface-500 hover:text-surface-300 hover:bg-surface-700/40'
                            }
                          `}
                        >
                          <SubIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{sub.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}

                {/* Sales sub-items */}
                {item.path === '/sales' && isSalesActive && !collapsed && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-surface-700 pl-3">
                    {salesSubItems.map((sub) => {
                      const SubIcon = sub.icon
                      const isSubActive = location.pathname === sub.path
                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium
                            transition-all duration-200
                            ${isSubActive
                              ? 'text-primary-400 bg-primary-500/10'
                              : 'text-surface-500 hover:text-surface-300 hover:bg-surface-700/40'
                            }
                          `}
                        >
                          <SubIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{sub.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom: User Profile + Actions */}
        <div className="flex flex-col border-t border-surface-700">
          {/* User Profile */}
          <div className={`flex items-center p-3 ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary-400" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Log Out */}
          <div className={`flex items-center px-3 pb-2 ${collapsed ? 'justify-center' : ''}`}>
            <button
              onClick={() => supabase.auth.signOut()}
              className={`flex items-center rounded-lg text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors ${collapsed ? 'p-2' : 'px-3 py-2 w-full gap-3'}`}
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Log Out</span>}
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-center p-3 border-t border-surface-700/50">
            <button
              onClick={toggleTheme}
              className={`flex items-center rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors ${collapsed ? 'p-2' : 'px-3 py-2 w-full gap-3'}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
              {!collapsed && <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
          </div>
          
          {/* Collapse Toggle */}
          <div className="hidden lg:flex items-center justify-center p-3 border-t border-surface-700/50">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`flex items-center rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors ${collapsed ? 'p-2' : 'px-3 py-2 w-full gap-3'}`}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4 flex-shrink-0" /> : <ChevronLeft className="w-4 h-4 flex-shrink-0" />}
              {!collapsed && <span className="text-sm font-medium">Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (mobile) */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-surface-700 bg-surface-800">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="ml-3 text-sm font-semibold text-surface-200">HSP ERP</h1>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
