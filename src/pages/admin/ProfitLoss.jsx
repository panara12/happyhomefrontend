import { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, Download } from 'lucide-react';

export default function ProfitLoss() {
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [viewType, setViewType] = useState('monthly');

  // Mock P&L Data
  const plData = {
    revenue: {
      salesRevenue: 2450000,
      otherIncome: 15000,
      total: 2465000
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Profit & Loss Statement</h2>
          <p className="text-gray-600 mt-1">Comprehensive income statement</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-300">
            <Calendar size={20} className="text-gray-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="outline-none"
            />
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg">
            <Download size={20} />
            Export PDF
          </button>
        </div>
      </div>

      {/* View Type Selector */}
      <div className="bg-white rounded-xl shadow-md p-2 inline-flex gap-2">
        <button
          onClick={() => setViewType('monthly')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            viewType === 'monthly'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setViewType('quarterly')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            viewType === 'quarterly'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Quarterly
        </button>
        <button
          onClick={() => setViewType('yearly')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            viewType === 'yearly'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Yearly
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} />
            <p className="text-sm opacity-90">Total Revenue</p>
          </div>
          <p className="text-3xl font-bold">₹{(plData.revenue.total / 100000).toFixed(2)}L</p>
          <p className="text-xs mt-2 opacity-80">+12.5% from last month</p>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
          <h3 className="text-2xl font-bold">Happy Home - Profit & Loss Statement</h3>
          <p className="text-sm opacity-80 mt-1">For the period: {new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="p-6">
          {/* Revenue Section */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">Revenue</h4>
            <div className="space-y-2 pl-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Sales Revenue</span>
                <span className="font-medium text-gray-800">₹{plData.revenue.salesRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Other Income</span>
                <span className="font-medium text-gray-800">₹{plData.revenue.otherIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg border-l-4 border-blue-500">
                <span className="font-bold text-gray-800">Total Revenue</span>
                <span className="font-bold text-blue-600 text-lg">₹{plData.revenue.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}