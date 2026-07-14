import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router'
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
  FileBarChart2,
  Wallet,
  Building2,
  Banknote,
  ListOrdered,
  Bell,
  CheckCircle2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useDueCheques } from '../hooks/useCheques'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/sales', label: 'Sales', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/vendors', label: 'Vendors', icon: Factory },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/banking', label: 'Banking', icon: Building2 },
  { path: '/cheques', label: 'Cheques', icon: Banknote },
  { path: '/transactions', label: 'Transactions', icon: ListOrdered },
  { path: '/reports', label: 'Reports', icon: FileBarChart2 },
]

const inventorySubItems = [
  { path: '/inventory/receive-stock', label: 'Receive Stock', icon: PackagePlus },
]

const salesSubItems = [
  { path: '/sales/new', label: 'New Order', icon: FilePlus },
]

function Layout() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  const notificationsRef = useRef(null)
  const navigate = useNavigate()

  const { data: dueCheques } = useDueCheques()

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) return saved === 'dark'
      return false // default to light
    }
    return false
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

        {/* Bottom: Actions */}
        <div className="flex flex-col border-t border-surface-700 mt-auto">
          {/* Collapse Toggle */}
          <div className="hidden lg:flex items-center justify-center p-3">
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
        {/* Universal Top Bar */}
        <header className="flex items-center justify-between h-14 px-4 border-b border-surface-700 bg-surface-800 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="lg:hidden ml-3 text-sm font-semibold text-surface-200">HSP ERP</h1>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {dueCheques?.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-surface-800"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up origin-top-right">
                  <div className="p-3 border-b border-surface-700 bg-surface-900/50 flex justify-between items-center">
                    <h3 className="font-semibold text-surface-50 text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary-400" />
                      Pending Cheques
                    </h3>
                    <span className="text-xs text-surface-400 font-medium bg-surface-700 px-2 py-0.5 rounded-full">
                      {dueCheques?.length || 0} Due
                    </span>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto">
                    {!dueCheques || dueCheques.length === 0 ? (
                      <div className="p-6 text-center text-surface-400 text-sm">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        No upcoming cheques due.
                      </div>
                    ) : (
                      <div className="divide-y divide-surface-700/50">
                        {dueCheques.map(cheque => {
                          const isMoneyIn = cheque.type === 'Money In'
                          const entity = cheque.customers?.name || cheque.vendors?.name || cheque.expenses?.category || 'Unknown'
                          const color = isMoneyIn ? 'text-emerald-400' : 'text-danger-400'
                          
                          // Format date nicely
                          const dateObj = new Date(cheque.cheque_date)
                          let dateLabel = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                          const today = new Date().toISOString().split('T')[0]
                          if (cheque.cheque_date === today) dateLabel = 'Today'
                          else if (cheque.cheque_date < today) dateLabel = 'Overdue'

                          return (
                            <div key={cheque.id} className="p-3 hover:bg-surface-700/30 transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-surface-200 text-sm truncate max-w-[150px]" title={entity}>
                                  {entity}
                                </span>
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                                  dateLabel === 'Overdue' ? 'bg-danger-500/15 text-danger-400' : 'bg-surface-700 text-surface-300'
                                }`}>
                                  {dateLabel}
                                </span>
                              </div>
                              <div className="flex justify-between items-end">
                                <div className="text-xs text-surface-400">
                                  Chq: {cheque.cheque_number || 'N/A'}
                                </div>
                                <div className={`font-semibold text-sm ${color}`}>
                                  {isMoneyIn ? '+' : '-'}Rs.{Number(cheque.amount).toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  {dueCheques?.length > 0 && (
                    <div className="p-2 border-t border-surface-700 bg-surface-900/50">
                      <button
                        onClick={() => {
                          setNotificationsOpen(false)
                          navigate('/cheques')
                        }}
                        className="w-full py-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors text-center"
                      >
                        View all Cheques →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-surface-700/50">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-400" />
                </div>
                <span className="text-sm font-medium text-surface-200 truncate max-w-[150px] lg:max-w-[200px]">
                  {user?.email}
                </span>
              </div>
              
              {/* Mobile User Icon */}
              <div className="sm:hidden w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-400" />
              </div>

              <button
                onClick={() => supabase.auth.signOut()}
                className="p-2 rounded-lg text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors flex items-center gap-2"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:block text-sm font-medium">Log Out</span>
              </button>
            </div>
          </div>
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
