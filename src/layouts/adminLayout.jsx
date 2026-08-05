// src/routes/admin/Layout.jsx
import React from "react"
import { Menu, X, LogOut } from "lucide-react"

const THEME = {
  gradientFrom: "from-amber-900",
  gradientTo: "to-orange-900",
  activeBg: "bg-white",
  activeText: "text-amber-900",
  hoverBg: "hover:bg-amber-800",
  idleText: "text-amber-100",
  border: "border-amber-700",
  panel: "bg-amber-800",
}

export default function Layout({ title, logoSrc, items, activeId, onSelect, onLogout, user, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <div className={`hidden lg:flex lg:flex-col lg:w-64 bg-gradient-to-b ${THEME.gradientFrom} ${THEME.gradientTo} text-white overflow-y-auto`}>
        <div className={`p-6 border-b ${THEME.border}`}>
          {logoSrc && (
            <img src={logoSrc} alt={title} className="w-20 h-20 mx-auto mb-3 bg-white rounded-full p-2" />
          )}
          <h2 className="text-xl font-bold text-center">{title}</h2>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map(item => {
            const Icon = item.icon
            const isActive = item.id === activeId
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive ? `${THEME.activeBg} ${THEME.activeText} shadow-lg` : `${THEME.hoverBg} ${THEME.idleText}`
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {onLogout && (
          <div className={`p-4 border-t ${THEME.border}`}>
            {user && (
              <div className={`mb-3 p-3 ${THEME.panel} rounded-lg`}>
                <p className="text-xs text-amber-200">Logged in as</p>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-xs text-amber-300 capitalize">{user.userType}</p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r ${THEME.gradientFrom} ${THEME.gradientTo} text-white z-50 shadow-lg`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {logoSrc && <img src={logoSrc} alt={title} className="w-10 h-10 bg-white rounded-full p-1" />}
            <div>
              <h2 className="font-bold">{title}</h2>
              {user && <p className="text-xs text-amber-200">{user.fullName}</p>}
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-amber-800 rounded-lg">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="bg-amber-900 border-t border-amber-700 max-h-[70vh] overflow-y-auto">
            <nav className="p-4 space-y-2">
              {items.map(item => {
                const Icon = item.icon
                const isActive = item.id === activeId
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive ? "bg-white text-amber-900" : "hover:bg-amber-800 text-amber-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all mt-4"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 mt-16 lg:mt-0 p-4 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}