import { useMemo, useState } from 'react';
import { Plus, DollarSign, Search, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from '../../components/ui/Modal';
import { useStoreContext } from '../../context/storeContext';
import { useAddExpense, useGetAllExpense, useUpdateExpense } from '../../hooks/useExpense';
import { useSelector } from 'react-redux';

export default function ExpenseManagement({user}) {
  const { stores } = useStoreContext();
  // const user = useSelector((state) => state.app.userInfo);
  // console.log(user)

  const { data: expensesData, isLoading: expensesLoading } = useGetAllExpense();
  // const expenses = expensesData?.expenses ?? [];
  const expenses = useMemo(() => expensesData?.expenses || [], [expensesData?.expenses])

  const { mutate: addExpense, isPending: isAdding } = useAddExpense();
  const { mutate: updateExpense, isPending: isApproving } = useUpdateExpense();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [formData, setFormData] = useState({
    storeId: user.userType === 'manager' && user.storeId ? user.storeId : '',
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

  const getStoreName = (storeId) => stores.find(s => s.storeId === storeId)?.name || storeId;

  const resetForm = () => setFormData({
    storeId: user.userType === 'manager' && user.storeId ? user.storeId : '',
    category: 'Utilities',
    description: '',
    amount: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddExpense = () => {
    if (!formData.description || !formData.amount || !formData.storeId) {
      toast.error('Please fill in store, description, and amount.');
      return;
    }

    addExpense(
      {
        date: formData.date,
        storeId: formData.storeId,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
      },
      {
        onSuccess: () => {
          toast.success('Expense recorded successfully!');
          resetForm();
          setShowAddModal(false);
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || 'Failed to record expense');
        }
      }
    );
  };

  const handleApprove = (expense) => {
    updateExpense(
      { id: expense._id, approve: true },
      {
        onSuccess: () => {
          toast.success('Expense approved!');
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || 'Failed to approve expense');
        }
      }
    );
  };

  const filteredExpenses = useMemo(() => expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.expenseId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    // Managers can only see their own store's expenses
    const matchesStore = user.userType === 'admin' || (user.storeId && exp.storeId === user.storeId);
    return matchesSearch && matchesCategory && matchesStore;
  }), [expenses, searchTerm, filterCategory, user.userType, user.storeId]);

  // Filter expenses for manager's store
  const relevantExpenses = useMemo(
    () => (user.userType === 'admin'
      ? expenses
      : (user.storeId ? expenses.filter(e => e.storeId === user.storeId) : expenses)),
    [expenses, user.userType, user.storeId]
  );

  const totalExpenses = useMemo(
    () => relevantExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [relevantExpenses]
  );

  // One pass over relevantExpenses instead of one .filter()/.reduce() per
  // category lookup — this data is read once per category in the breakdown
  // grid plus again in the "largest category" calculation below.
  const categoryStats = useMemo(() => {
    const stats = {};
    for (const exp of relevantExpenses) {
      const entry = stats[exp.category] || { total: 0, count: 0 };
      entry.total += (exp.amount || 0);
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
          <p className="text-gray-600 text-sm">Total Records</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{relevantExpenses.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">{user.userType === 'admin' ? 'Avg per Store' : 'Categories'}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {user.userType === 'admin' ? `₹${Math.round(totalExpenses / (stores.length || 1)).toLocaleString()}` : categories.filter(c => c !== 'All' && getCategoryTotal(c) > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Largest Category</p>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {categories.filter(c => c !== 'All').reduce((max, cat) =>
              getCategoryTotal(cat) > getCategoryTotal(max) ? cat : max, categories[1])}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ₹{Math.max(0, ...categories.filter(c => c !== 'All').map(c => getCategoryTotal(c))).toLocaleString()}
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
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expensesLoading && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Loading expenses...</td></tr>
              )}
              {!expensesLoading && expensesPagination.paginatedItems.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">No expenses found.</td></tr>
              )}
              {expensesPagination.paginatedItems.map(expense => (
                <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{expense.expenseId}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{getStoreName(expense.storeId)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{expense.description}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">-₹{(expense.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{expense.paymentMethod}</td>
                  <td className="px-4 py-3 text-center">
                    {expense.approuvedById ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center justify-center gap-1">
                        <CheckCircle size={12} />
                        Approved
                      </span>
                    ) : user.userType === 'admin' ? (
                      <button
                        onClick={() => handleApprove(expense)}
                        disabled={isApproving}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Pending
                      </span>
                    )}
                  </td>
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
        <Modal
          title="Add New Expense"
          onClose={() => setShowAddModal(false)}
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setShowAddModal(false)} className={modalSecondaryBtnClass}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddExpense}
                disabled={isAdding}
                className={modalPrimaryBtnClass}
              >
                {isAdding ? 'Adding...' : 'Add Expense'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={modalLabelClass}>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Store</label>
              <select
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className={modalInputClass}
                disabled={user.userType === 'manager'}
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option value={store.storeId} key={store.storeId}>{store.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={modalInputClass}
              >
                {categories.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Amount (₹)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={modalInputClass}
                placeholder="10000"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={modalInputClass}
                rows={2}
                placeholder="Enter expense description"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className={modalInputClass}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}