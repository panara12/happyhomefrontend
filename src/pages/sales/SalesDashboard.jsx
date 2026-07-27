import { useState } from 'react';
import { LayoutDashboard, Package, FileText, LogOut, Menu, X } from 'lucide-react';
import InventoryManagement from '../admin/InventoryManagement';
import InvoiceManagement from '../admin/InvoiceManagement';
import DashboardHome from '../admin/DashboardHome';

export default function SalesDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'invoices', label: 'Invoices', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome user={user} />;
      case 'inventory':
        return <InventoryManagement user={user} />;
      case 'invoices':
        return <InvoiceManagement user={user} />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 bg-gradient-to-b from-amber-900 to-orange-900 text-white">
        <div className="p-6 border-b border-amber-700">
          <img
            src="/src/imports/475883765_1412800516794054_7992306912571437520_n-1.jpg"
            alt="Happy Home"
            className="w-20 h-20 mx-auto mb-3 bg-white rounded-full p-2"
          />
          <h2 className="text-xl font-bold text-center">Happy Home</h2>
          <p className="text-xs text-amber-200 text-center mt-1">Sales Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-white text-amber-900 shadow-lg'
                  : 'hover:bg-amber-800 text-amber-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-amber-700">
          <div className="mb-3 p-3 bg-amber-800 rounded-lg">
            <p className="text-xs text-amber-200">Logged in as</p>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-amber-300 capitalize">{user.role}{user.storeId ? ` - Store ${user.storeId}` : ''}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-900 to-orange-900 text-white z-50 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src="/src/imports/475883765_1412800516794054_7992306912571437520_n-1.jpg"
              alt="Happy Home"
              className="w-10 h-10 bg-white rounded-full p-1"
            />
            <div>
              <h2 className="font-bold">Happy Home</h2>
              <p className="text-xs text-amber-200">{user.name}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-amber-800 rounded-lg"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="bg-amber-900 border-t border-amber-700">
            <nav className="p-4 space-y-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-white text-amber-900'
                      : 'hover:bg-amber-800 text-amber-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all mt-4"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 mt-16 lg:mt-0">
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}