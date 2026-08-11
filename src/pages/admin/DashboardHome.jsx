import { TrendingUp, TrendingDown, Package, FileText, Store, Users, DollarSign, ShoppingCart, Receipt, RotateCcw, BarChart3 } from 'lucide-react';
import { useLoggedUserContext } from '../../context/loggedUserContext';

export default function DashboardHome() {

    const { loggedUser} = useLoggedUserContext();
    const user =  loggedUser
    console.log(user)

  const stats = user?.userType === 'admin' ? [
    {
      label: 'Net Profit (Month)',
      value: '₹5.33L',
      change: '+15.8%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      label: 'Sales Revenue',
      value: '₹24.65L',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-blue-500'
    },
    {
      label: 'Purchase Value',
      value: '₹12.00L',
      change: '+8.2%',
      trend: 'up',
      icon: Receipt,
      color: 'bg-purple-500'
    },
    {
      label: 'GST Payable',
      value: '₹1.53L',
      change: 'Net tax',
      trend: 'up',
      icon: BarChart3,
      color: 'bg-orange-500'
    },
    {
      label: 'Sales Returns',
      value: '₹53,098',
      change: '2 returns',
      trend: 'down',
      icon: RotateCcw,
      color: 'bg-red-500'
    },
    {
      label: 'Total Stores',
      value: '3',
      change: 'Active',
      trend: 'up',
      icon: Store,
      color: 'bg-cyan-500'
    },
    {
      label: 'Total Inventory',
      value: '1,234',
      change: '-5.2%',
      trend: 'down',
      icon: Package,
      color: 'bg-indigo-500'
    },
    {
      label: 'Active Users',
      value: '12',
      change: '+2 new',
      trend: 'up',
      icon: Users,
      color: 'bg-pink-500'
    },
  ] : user.userType === 'manager' ? [
    {
      label: 'Store Revenue',
      value: '₹82,450',
      change: '+15.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      label: 'Store Inventory',
      value: '450',
      change: '-3.1%',
      trend: 'down',
      icon: Package,
      color: 'bg-purple-500'
    },
    {
      label: 'Invoices (Month)',
      value: '52',
      change: '+10.5%',
      trend: 'up',
      icon: FileText,
      color: 'bg-orange-500'
    },
    {
      label: 'Sales Team',
      value: '4',
      change: '+1 new',
      trend: 'up',
      icon: Users,
      color: 'bg-pink-500'
    },
    {
      label: 'Pending POs',
      value: '8',
      change: '+3',
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-amber-500'
    },
    {
      label: 'Store Transfers',
      value: '12',
      change: '+2',
      trend: 'up',
      icon: Store,
      color: 'bg-blue-500'
    },
  ] : [
    {
      label: 'My Invoices',
      value: '18',
      change: '+5 today',
      trend: 'up',
      icon: FileText,
      color: 'bg-orange-500'
    },
    {
      label: 'Total Sales',
      value: '₹45,780',
      change: '+18.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      label: 'Store Inventory',
      value: '450',
      change: '-3.1%',
      trend: 'down',
      icon: Package,
      color: 'bg-purple-500'
    },
    {
      label: 'Customers',
      value: '34',
      change: '+12',
      trend: 'up',
      icon: Users,
      color: 'bg-pink-500'
    },
  ];

  const recentActivity = [
    { action: 'Purchase bill created', store: 'Store 1 - ₹2,28,000', time: '5 mins ago', type: 'purchase-bill' },
    { action: 'Sales return approved', store: 'Store 2 - ₹30,679', time: '10 mins ago', type: 'return' },
    { action: 'New invoice created', store: 'Store 1 - ₹52,997', time: '25 mins ago', type: 'invoice' },
    { action: 'Item transferred', store: 'Store 2 → Store 3', time: '45 mins ago', type: 'transfer' },
    { action: 'GST report generated', store: 'GSTR-1 for April', time: '1 hour ago', type: 'gst' },
    { action: 'Purchase order received', store: 'Store 1', time: '2 hours ago', type: 'purchase' },
    { action: 'Expense recorded', store: 'Store 2 - Utilities', time: '3 hours ago', type: 'expense' },
  ];

  const lowStockItems = [
    { name: 'Product A', store: 'Store 1', quantity: 5, minStock: 20 },
    { name: 'Product B', store: 'Store 2', quantity: 3, minStock: 15 },
    { name: 'Product C', store: 'Store 3', quantity: 8, minStock: 25 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin'
              ? "Here's what's happening with your stores today"
              : user.role === 'manager' && user.storeId
              ? `Here's what's happening at Store ${user.storeId} today`
              : user.role === 'manager'
              ? "Here's what's happening at your store today"
              : `Here's your performance overview`}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <div className="flex items-center gap-2 mt-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : (
                    <TrendingDown size={16} className="text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`${stat.color} p-4 rounded-full text-white`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Summary for Admin */}
      {user.role === 'admin' && (
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white rounded-xl shadow-xl p-6">
          <h3 className="text-2xl font-bold mb-6">Monthly Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-90 mb-1">Gross Profit</p>
              <p className="text-3xl font-bold">₹14.15L</p>
              <p className="text-xs opacity-80 mt-1">Margin: 57.4%</p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Operating Profit</p>
              <p className="text-3xl font-bold">₹6.85L</p>
              <p className="text-xs opacity-80 mt-1">Margin: 27.8%</p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Net Profit</p>
              <p className="text-3xl font-bold">₹5.33L</p>
              <p className="text-xs opacity-80 mt-1">Margin: 21.6%</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white border-opacity-30">
            <div>
              <p className="text-xs opacity-80 mb-1">Total Expenses</p>
              <p className="text-xl font-bold">₹7.48L</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">GST Input</p>
              <p className="text-xl font-bold">₹1.53L</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">GST Output</p>
              <p className="text-xl font-bold">₹3.06L</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">Tax Payable</p>
              <p className="text-xl font-bold">₹1.53L</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'invoice' ? 'bg-orange-500' :
                  activity.type === 'transfer' ? 'bg-blue-500' :
                  activity.type === 'purchase' ? 'bg-green-500' :
                  activity.type === 'purchase-bill' ? 'bg-purple-500' :
                  activity.type === 'return' ? 'bg-red-500' :
                  activity.type === 'gst' ? 'bg-indigo-500' :
                  activity.type === 'user' ? 'bg-pink-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.store}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions for Admin */}
        {user.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                <Receipt className="text-blue-600 mb-2" size={24} />
                <p className="font-medium text-gray-800 text-sm">Purchase Bill</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                <FileText className="text-green-600 mb-2" size={24} />
                <p className="font-medium text-gray-800 text-sm">Sales Invoice</p>
              </button>
              <button className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left">
                <RotateCcw className="text-red-600 mb-2" size={24} />
                <p className="font-medium text-gray-800 text-sm">Sales Return</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                <BarChart3 className="text-purple-600 mb-2" size={24} />
                <p className="font-medium text-gray-800 text-sm">GST Reports</p>
              </button>
              <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-left">
                <TrendingUp className="text-amber-600 mb-2" size={24} />
                <p className="font-medium text-gray-800 text-sm">P&L Report</p>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                <DollarSign className="text-orange-600 mb-2" size={24} />
                <p className="font-medium text-gray-800 text-sm">Expenses</p>
              </button>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-red-100 text-red-600 p-2 rounded-lg">
              <Package size={20} />
            </span>
            Low Stock Alert
          </h3>
          <div className="space-y-4">
            {lowStockItems.map((item, index) => (
              <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                    {item.store}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current: <span className="font-bold text-red-600">{item.quantity}</span></span>
                  <span className="text-gray-600">Min Required: {item.minStock}</span>
                </div>
                <div className="mt-2 bg-red-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-600 h-full"
                    style={{ width: `${(item.quantity / item.minStock) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}