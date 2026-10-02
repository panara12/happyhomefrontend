import { useMemo, useState } from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import { useGetDashboardData } from '../../hooks/useGetAllAccountStates';

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-IN');
}

function formatPeriodLabel(viewType, selectedMonth) {
  if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return '—';
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const date = new Date(year, monthIndex, 1);

  if (viewType === 'yearly') {
    return `Year ${year}`;
  }

  if (viewType === 'quarterly') {
    const q = Math.floor(monthIndex / 3) + 1;
    const start = new Date(year, (q - 1) * 3, 1);
    const end = new Date(year, (q - 1) * 3 + 2, 1);
    return `Q${q} ${year} (${start.toLocaleDateString('en-IN', { month: 'short' })} – ${end.toLocaleDateString('en-IN', { month: 'short' })})`;
  }

  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function formatLakhs(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return (n / 100000).toFixed(2);
}

export default function ProfitLoss() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [viewType, setViewType] = useState('monthly');
  const [activeTab, setActiveTab] = useState('revenue');
  const [startDate, setStartDate] = useState(`${defaultMonth}-01`);
  const [endDate, setEndDate] = useState(today);

  const { data: dashboardData, isLoading, isFetching } = useGetDashboardData({
    enabled: activeTab === 'revenue',
    period: viewType,
    month: selectedMonth,
  });
  const { data: paymentData, isLoading: isPaymentLoading, isFetching: isPaymentFetching } = useGetDashboardData({
    enabled: activeTab === 'revenueInfo' && Boolean(startDate && endDate && startDate <= endDate),
    startDate,
    endDate,
  });

  const salesRevenue = Number(dashboardData?.totalSales) || 0;
  const otherIncome = 0;
  const totalRevenue = salesRevenue + otherIncome;
  const paymentModeTotals = paymentData?.paymentModeTotals || {};
  const totalCollection =
    (Number(paymentModeTotals.upi) || 0) +
    (Number(paymentModeTotals.cash) || 0) +
    (Number(paymentModeTotals.debit) || 0);

  const periodLabel = useMemo(
    () => formatPeriodLabel(viewType, selectedMonth),
    [viewType, selectedMonth]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Profit & Loss Statement</h2>
          <p className="text-gray-600 mt-1">Comprehensive income statement</p>
        </div>
        {activeTab === 'revenue' && <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-300">
            <Calendar size={20} className="text-gray-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="outline-none"
            />
          </div>
        </div>}
      </div>

      <div className="flex border-b border-gray-200" role="tablist" aria-label="Profit and loss views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'revenue'}
          onClick={() => setActiveTab('revenue')}
          className={`px-5 py-3 font-medium border-b-2 ${activeTab === 'revenue' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Revenue
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'revenueInfo'}
          onClick={() => setActiveTab('revenueInfo')}
          className={`px-5 py-3 font-medium border-b-2 ${activeTab === 'revenueInfo' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          Revenue Info
        </button>
      </div>

      {activeTab === 'revenue' ? <>
      <div className="inline-flex gap-2 border-b border-gray-200">
        <button
          type="button"
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
          type="button"
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
          type="button"
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
          <p className="text-3xl font-bold">
            {isLoading ? '…' : `₹${formatLakhs(totalRevenue)}L`}
          </p>
          <p className="text-xs mt-2 opacity-80">{periodLabel}</p>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
          <h3 className="text-2xl font-bold">Happy Home - Profit & Loss Statement</h3>
          <p className="text-sm opacity-80 mt-1">For the period: {periodLabel}</p>
        </div>

        <div className="p-6">
          {(isLoading || isFetching) && (
            <p className="text-sm text-gray-500 mb-4">Loading sales revenue…</p>
          )}

          {/* Revenue Section */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">Revenue</h4>
            <div className="space-y-2 pl-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Sales Revenue</span>
                <span className="font-medium text-gray-800">₹{money(salesRevenue)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Other Income</span>
                <span className="font-medium text-gray-800">₹{money(otherIncome)}</span>
              </div>
              <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg border-l-4 border-blue-500">
                <span className="font-bold text-gray-800">Total Revenue</span>
                <span className="font-bold text-blue-600 text-lg">₹{money(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </> : <section className="space-y-5" role="tabpanel">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Start date
            <span className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded">
              <Calendar size={18} className="text-gray-500" />
              <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className="outline-none" />
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            End date
            <span className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded">
              <Calendar size={18} className="text-gray-500" />
              <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="outline-none" />
            </span>
          </label>
        </div>
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">UPI</th>
                <th scope="col" className="px-5 py-3 font-semibold">Cash</th>
                <th scope="col" className="px-5 py-3 font-semibold">Debit</th>
                <th scope="col" className="px-5 py-3 font-semibold">Total Collection</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-5 py-4 font-medium text-gray-900">{isPaymentLoading || isPaymentFetching ? '…' : `₹${money(paymentData?.paymentModeTotals?.upi)}`}</td>
                <td className="px-5 py-4 font-medium text-gray-900">{isPaymentLoading || isPaymentFetching ? '…' : `₹${money(paymentData?.paymentModeTotals?.cash)}`}</td>
                <td className="px-5 py-4 font-medium text-gray-900">{isPaymentLoading || isPaymentFetching ? '…' : `₹${money(paymentData?.paymentModeTotals?.debit)}`}</td>
                <td className="px-5 py-4 font-semibold text-gray-900">{isPaymentLoading || isPaymentFetching ? '…' : `₹${money(totalCollection)}`}</td>
              </tr>
            </tbody>
          </table>
          {startDate && endDate && startDate > endDate && <p className="px-5 py-3 text-sm text-red-700">Start date must be on or before end date.</p>}
        </div>
      </section>}
    </div>
  );
}
