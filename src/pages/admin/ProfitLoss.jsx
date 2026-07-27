import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';

export default function ProfitLoss({ user }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [viewType, setViewType] = useState('monthly');

  // Mock P&L Data
  const plData = {
    revenue: {
      salesRevenue: 2450000,
      otherIncome: 15000,
      total: 2465000
    },
    costOfGoodsSold: {
      openingStock: 500000,
      purchases: 1200000,
      closingStock: 650000,
      total: 1050000
    },
    grossProfit: 1415000,
    operatingExpenses: {
      salaries: 350000,
      rent: 135000,
      utilities: 45000,
      marketing: 65000,
      transportation: 35000,
      maintenance: 28000,
      insurance: 15000,
      depreciation: 25000,
      miscellaneous: 32000,
      total: 730000
    },
    operatingProfit: 685000,
    otherExpenses: {
      interestExpense: 15000,
      bankCharges: 3500,
      total: 18500
    },
    profitBeforeTax: 666500,
    tax: 133300,
    netProfit: 533200
  };

  const grossProfitMargin = ((plData.grossProfit / plData.revenue.total) * 100).toFixed(2);
  const netProfitMargin = ((plData.netProfit / plData.revenue.total) * 100).toFixed(2);
  const operatingProfitMargin = ((plData.operatingProfit / plData.revenue.total) * 100).toFixed(2);

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

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} />
            <p className="text-sm opacity-90">Gross Profit</p>
          </div>
          <p className="text-3xl font-bold">₹{(plData.grossProfit / 100000).toFixed(2)}L</p>
          <p className="text-xs mt-2 opacity-80">Margin: {grossProfitMargin}%</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} />
            <p className="text-sm opacity-90">Operating Profit</p>
          </div>
          <p className="text-3xl font-bold">₹{(plData.operatingProfit / 100000).toFixed(2)}L</p>
          <p className="text-xs mt-2 opacity-80">Margin: {operatingProfitMargin}%</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} />
            <p className="text-sm opacity-90">Net Profit</p>
          </div>
          <p className="text-3xl font-bold">₹{(plData.netProfit / 100000).toFixed(2)}L</p>
          <p className="text-xs mt-2 opacity-80">Margin: {netProfitMargin}%</p>
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

          {/* Cost of Goods Sold */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-red-500">Cost of Goods Sold</h4>
            <div className="space-y-2 pl-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Opening Stock</span>
                <span className="font-medium text-gray-800">₹{plData.costOfGoodsSold.openingStock.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Add: Purchases</span>
                <span className="font-medium text-gray-800">₹{plData.costOfGoodsSold.purchases.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Less: Closing Stock</span>
                <span className="font-medium text-gray-800">₹{plData.costOfGoodsSold.closingStock.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 bg-red-50 px-4 rounded-lg border-l-4 border-red-500">
                <span className="font-bold text-gray-800">Total COGS</span>
                <span className="font-bold text-red-600 text-lg">₹{plData.costOfGoodsSold.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold text-gray-800">Gross Profit</h4>
                <p className="text-sm text-gray-600">Revenue - COGS</p>
              </div>
              <span className="text-3xl font-bold text-green-600">₹{plData.grossProfit.toLocaleString()}</span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-500">Operating Expenses</h4>
            <div className="space-y-2 pl-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Salaries & Wages</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.salaries.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Rent</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.rent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Utilities</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.utilities.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Marketing & Advertising</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.marketing.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Transportation</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.transportation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Maintenance & Repairs</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.maintenance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Insurance</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.insurance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Depreciation</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.depreciation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Miscellaneous</span>
                <span className="font-medium text-gray-800">₹{plData.operatingExpenses.miscellaneous.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 bg-orange-50 px-4 rounded-lg border-l-4 border-orange-500">
                <span className="font-bold text-gray-800">Total Operating Expenses</span>
                <span className="font-bold text-orange-600 text-lg">₹{plData.operatingExpenses.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Operating Profit */}
          <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border-2 border-purple-500">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold text-gray-800">Operating Profit (EBIT)</h4>
                <p className="text-sm text-gray-600">Gross Profit - Operating Expenses</p>
              </div>
              <span className="text-3xl font-bold text-purple-600">₹{plData.operatingProfit.toLocaleString()}</span>
            </div>
          </div>

          {/* Other Expenses */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-500">Other Expenses</h4>
            <div className="space-y-2 pl-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Interest Expense</span>
                <span className="font-medium text-gray-800">₹{plData.otherExpenses.interestExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Bank Charges</span>
                <span className="font-medium text-gray-800">₹{plData.otherExpenses.bankCharges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 bg-gray-50 px-4 rounded-lg border-l-4 border-gray-500">
                <span className="font-bold text-gray-800">Total Other Expenses</span>
                <span className="font-bold text-gray-600 text-lg">₹{plData.otherExpenses.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Profit Before Tax */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold text-gray-800">Profit Before Tax (PBT)</h4>
                <p className="text-sm text-gray-600">Operating Profit - Other Expenses</p>
              </div>
              <span className="text-3xl font-bold text-blue-600">₹{plData.profitBeforeTax.toLocaleString()}</span>
            </div>
          </div>

          {/* Tax */}
          <div className="mb-8 pl-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-700 font-medium">Less: Income Tax (20%)</span>
              <span className="font-medium text-gray-800">₹{plData.tax.toLocaleString()}</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-6 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 rounded-xl border-4 border-amber-500 shadow-lg">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Net Profit (PAT)</h3>
                <p className="text-sm text-gray-600">Profit After Tax - Bottom Line</p>
                <div className="mt-2 flex gap-4">
                  <span className="text-xs font-medium px-3 py-1 bg-white rounded-full text-amber-700">
                    Gross Margin: {grossProfitMargin}%
                  </span>
                  <span className="text-xs font-medium px-3 py-1 bg-white rounded-full text-amber-700">
                    Net Margin: {netProfitMargin}%
                  </span>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="flex items-baseline gap-2 justify-center md:justify-end">
                  <TrendingUp className="text-green-600" size={32} />
                  <span className="text-5xl font-bold text-amber-600">₹{plData.netProfit.toLocaleString()}</span>
                </div>
                <p className="text-sm text-green-600 font-medium mt-2">↑ 15.8% increase from last period</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}