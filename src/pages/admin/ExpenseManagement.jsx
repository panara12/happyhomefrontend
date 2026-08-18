import { useMemo, useState } from 'react';
import { Plus, DollarSign, Search, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';

export default function ExpenseManagement({ user }) {
  const [expenses, setExpenses] = useState([
    {
      id: 'EXP-001',
      date: '2026-04-18',
      store: 'Store 1',
      category: 'Utilities',
      description: 'Electricity Bill - March 2026',
      amount: 12500,
      paymentMethod: 'Bank Transfer',
      approvedBy: 'Admin User'
    },
    {
      id: 'EXP-002',
      date: '2026-04-19',
      store: 'Store 2',
      category: 'Maintenance',
      description: 'AC Repair and Servicing',
      amount: 8500,
      paymentMethod: 'Cash',
      approvedBy: 'Admin User'
    },
    {
      id: 'EXP-003',
      date: '2026-04-20',
      store: 'Store 1',
      category: 'Salaries',
      description: 'Staff Salaries - April 2026',
      amount: 125000,
      paymentMethod: 'Bank Transfer',
      approvedBy: 'Admin User'
    },
    {
      id: 'EXP-004',
      date: '2026-04-21',
      store: 'Store 3',
      category: 'Rent',
      description: 'Store Rent - April 2026',
      amount: 45000,
      paymentMethod: 'Cheque',
      approvedBy: 'Admin User'
    },
    {
      id: 'EXP-005',
      date: '2026-04-22',
      store: 'Store 2',
      category: 'Marketing',
      description: 'Facebook Ads Campaign',
      amount: 15000,
      paymentMethod: 'Credit Card',
      approvedBy: 'Admin User'
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [formData, setFormData] = useState({
    store: user.role === 'manager' && user.storeId ? `Store ${user.storeId}` : 'Store 1',
    category: 'Utilities',
    description: '',
    amount: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'All',
    'Utilities',
    'Rent',
    'Salaries',
    'Maintenance',
    'Marketing',
    'Supplies',
    'Transportation',
    'Miscellaneous'
  ];

  const paymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'UPI'];

  const handleAddExpense = () => {
    if (formData.description && formData.amount) {
      const newExpense = {
        id: `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
        date: formData.date,
        store: formData.store,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        approvedBy: user.name
      };
      setExpenses([newExpense, ...expenses]);
      setFormData({
        store: 'Store 1',
        category: 'Utilities',
        description: '',
        amount: '',
        paymentMethod: 'Cash',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
      toast.success('Expense recorded successfully!');
    }
  };

  const filteredExpenses = useMemo(() => expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    // Managers can only see their own store's expenses
    const matchesStore = user.role === 'admin' || (user.storeId && exp.store === `Store ${user.storeId}`);
    return matchesSearch && matchesCategory && matchesStore;
  }), [expenses, searchTerm, filterCategory, user.role, user.storeId]);

  // Filter expenses for manager's store
  const relevantExpenses = useMemo(
    () => (user.role === 'admin'
      ? expenses
      : (user.storeId ? expenses.filter(e => e.store === `Store ${user.storeId}`) : expenses)),
    [expenses, user.role, user.storeId]
  );

  const totalExpenses = useMemo(
    () => relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    [relevantExpenses]
  );

  // One pass over relevantExpenses instead of one .filter()/.reduce() per
  // category lookup — this data is read once per category in the breakdown
  // grid plus again in the "largest category" calculation below.
  const categoryStats = useMemo(() => {
    const stats = {};
    for (const exp of relevantExpenses) {
      const entry = stats[exp.category] || { total: 0, count: 0 };
      entry.total += exp.amount;
      entry.count += 1;
      stats[exp.category] = entry;
    }
    return stats;
  }, [relevantExpenses]);

  const getCategoryTotal = (category) => categoryStats[category]?.total || 0;
  const getCategoryCount = (category) => categoryStats[category]?.count || 0;

  const expensesPagination = usePagination(filteredExpenses);

  const getCategoryColor = (category) => {
    const colors = {
      'Utilities': 'bg-blue-100 text-blue-700',
      'Rent': 'bg-purple-100 text-purple-700',
      'Salaries': 'bg-green-100 text-green-700',
      'Maintenance': 'bg-orange-100 text-orange-700',
      'Marketing': 'bg-pink-100 text-pink-700',
      'Supplies': 'bg-amber-100 text-amber-700',
      'Transportation': 'bg-cyan-100 text-cyan-700',
      'Miscellaneous': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Expense Management</h2>
          <p className="text-gray-600 mt-1">Track and manage store expenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} />
            <p className="text-sm opacity-90">Total Expenses</p>
          </div>
          <p className="text-3xl font-bold">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">This Month</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{relevantExpenses.length}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            +8% from last month
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">{user.role === 'admin' ? 'Avg per Store' : 'Categories'}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {user.role === 'admin' ? `₹${Math.round(totalExpenses / 3).toLocaleString()}` : categories.filter(c => c !== 'All' && getCategoryTotal(c) > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Largest Category</p>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {categories.filter(c => c !== 'All').reduce((max, cat) =>
              getCategoryTotal(cat) > getCategoryTotal(max) ? cat : max, 'Salaries')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ₹{Math.max(...categories.filter(c => c !== 'All').map(c => getCategoryTotal(c))).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Expense by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.filter(c => c !== 'All').map(category => {
            const total = getCategoryTotal(category);
            return (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                  {category}
                </span>
                <p className="text-xl font-bold text-gray-800 mt-2">₹{total.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{getCategoryCount(category)} expenses</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search expenses by description or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Store</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Approved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expensesPagination.paginatedItems.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{expense.id}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {expense.date}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{expense.store}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{expense.description}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">-₹{expense.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{expense.paymentMethod}</td>
                  <td className="px-4 py-3 text-gray-600">{expense.approvedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={expensesPagination.page}
          totalPages={expensesPagination.totalPages}
          totalItems={expensesPagination.totalItems}
          pageSize={expensesPagination.pageSize}
          onPageChange={expensesPagination.goToPage}
        />
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Expense</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store</label>
                <select
                  value={formData.store}
                  onChange={(e) => setFormData({...formData, store: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  disabled={user.role === 'manager'}
                >
                  {user.role === 'admin' ? (
                    <>
                      <option value="Store 1">Store 1</option>
                      <option value="Store 2">Store 2</option>
                      <option value="Store 3">Store 3</option>
                    </>
                  ) : user.storeId ? (
                    <option value={`Store ${user.storeId}`}>Store {user.storeId}</option>
                  ) : (
                    <option value="Store 1">Store 1</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Enter expense description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}