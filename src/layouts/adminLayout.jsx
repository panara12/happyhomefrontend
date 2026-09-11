// src/routes/Layout.jsx
import React from "react"
import { Menu, X, LogOut } from "lucide-react"

const DEFAULT_THEME = {
  gradientFrom: "from-amber-900",
  gradientTo: "to-orange-900",
  activeBg: "bg-white",
  activeText: "text-amber-900",
  hoverBg: "hover:bg-amber-800",
  idleText: "text-amber-100",
  border: "border-amber-700",
  panel: "bg-amber-800",
  subtitleText: "text-amber-200",
  subtitleText2: "text-amber-300",
}

function formatPersonName(name) {
  if (!name) return ""
  return String(name)
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export default function Layout({ title, subtitle, logoSrc, items, activeId, onSelect, onLogout, user, theme, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const T = { ...DEFAULT_THEME, ...theme }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop: fixed to viewport so Logout stays visible */}
      <div
        className={`hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 bg-gradient-to-b ${T.gradientFrom} ${T.gradientTo} text-white`}
      >
        <div className={`shrink-0 p-6 border-b ${T.border}`}>
          {logoSrc && (
            <img src={logoSrc} alt={title} className="w-20 h-20 mx-auto mb-3 bg-white rounded-full p-2" />
          )}
          <h2 className="text-xl font-bold text-center">{title}</h2>
          {subtitle && <p className={`text-xs ${T.subtitleText} text-center mt-1`}>{subtitle}</p>}
        </div>

        <nav className="sidebar-scroll flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
          {items.map(item => {
            const Icon = item.icon
            const isActive = item.id === activeId
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive ? `${T.activeBg} ${T.activeText} shadow-lg` : `${T.hoverBg} ${T.idleText}`
                }`}
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {onLogout && (
          <div className={`shrink-0 px-3 py-3 border-t ${T.border} space-y-2`}>
            {user && (
              <div className="px-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {formatPersonName(user.fullName || user.name)}
                  <span className={`${T.subtitleText2} font-normal`}>
                    {" "}({formatPersonName(user.userType || user.role)})
                  </span>
                </p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r ${T.gradientFrom} ${T.gradientTo} text-white z-50 shadow-lg`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {logoSrc && <img src={logoSrc} alt={title} className="w-10 h-10 bg-white rounded-full p-1" />}
            <div>
              <h2 className="font-bold">{title}</h2>
              {user && (
                <p className={`text-xs ${T.subtitleText} truncate`}>
                  {formatPersonName(user.fullName || user.name)}
                  {" "}({formatPersonName(user.userType || user.role)})
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-black/20 rounded-lg">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={`sidebar-scroll bg-gradient-to-b ${T.gradientFrom} ${T.gradientTo} border-t ${T.border} max-h-[70vh] overflow-y-auto`}>
            <nav className="p-3 space-y-1">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive ? `${T.activeBg} ${T.activeText}` : `${T.hoverBg} ${T.idleText}`
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                )
              })}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all mt-3 text-sm"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="thin-scroll flex-1 w-full lg:ml-64 mt-16 lg:mt-0 p-4 lg:p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  )
}
