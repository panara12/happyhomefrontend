import { useState } from 'react';
import { Plus, Search, Trash2, CheckCircle, XCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function DistributorReturns({ user }) {
  const [returns, setReturns] = useState([
    {
      id: '1',
      returnNumber: 'RET-001',
      billNumber: 'PB-001',
      distributorName: 'ABC Distributors',
      distributorGSTIN: '27AABCU9603R1ZM',
      returnDate: '2026-04-20',
      items: [
        { productName: 'Product A', hsn: '8443', quantity: 5, rate: 100, gst: 18, amount: 590 }
      ],
      reason: 'Damaged goods received',
      status: 'approved',
      totalAmount: 590,
      store: 'Store 1',
      createdBy: 'Admin'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState('Store 1');

  const [formData, setFormData] = useState({
    billNumber: '',
    distributorName: '',
    distributorGSTIN: '',
    returnDate: new Date().toISOString().split('T')[0],
    reason: '',
    items: [{ productName: '', hsn: '', quantity: 0, rate: 0, gst: 18 }]
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: '', hsn: '', quantity: 0, rate: 0, gst: 18 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateItemAmount = (item) => {
    const baseAmount = item.quantity * item.rate;
    const gstAmount = (baseAmount * item.gst) / 100;
    return baseAmount + gstAmount;
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.billNumber || !formData.distributorName || !formData.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.items.some(item => !item.productName || item.quantity <= 0 || item.rate <= 0)) {
      toast.error('Please fill all item details correctly');
      return;
    }

    const newReturn = {
      id: Date.now().toString(),
      returnNumber: `RET-${String(returns.length + 1).padStart(3, '0')}`,
      billNumber: formData.billNumber,
      distributorName: formData.distributorName,
      distributorGSTIN: formData.distributorGSTIN,
      returnDate: formData.returnDate,
      items: formData.items.map(item => ({
        ...item,
        amount: calculateItemAmount(item)
      })),
      reason: formData.reason,
      status: 'pending',
      totalAmount: calculateTotal(),
      store: selectedStore,
      createdBy: user.name
    };

    setReturns([newReturn, ...returns]);
    toast.success('Distributor return created successfully! Inventory will be reduced.');
    setShowModal(false);
    setFormData({
      billNumber: '',
      distributorName: '',
      distributorGSTIN: '',
      returnDate: new Date().toISOString().split('T')[0],
      reason: '',
      items: [{ productName: '', hsn: '', quantity: 0, rate: 0, gst: 18 }]
    });
  };

  const handleStatusChange = (id, status) => {
    setReturns(returns.map(ret =>
      ret.id === id ? { ...ret, status } : ret
    ));
    toast.success(`Return ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
  };

  const filteredReturns = returns.filter(ret =>
    ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.distributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    totalAmount: returns.reduce((sum, r) => sum + r.totalAmount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distributor Returns</h1>
          <p className="text-sm text-gray-600 mt-1">Return defective or excess items to distributors</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} />
          New Return
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Package className="text-blue-600 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Creating a distributor return will reduce inventory from the selected store.
              Returns must be linked to an original purchase bill.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Returns</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-800">Pending</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-800">Approved</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-800">Rejected</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{stats.rejected}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4">
          <p className="text-sm text-purple-800">Total Amount</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">₹{stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by return number, distributor, or bill number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Return #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Bill #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Distributor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Store</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{ret.returnNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{ret.billNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>{ret.distributorName}</div>
                    <div className="text-xs text-gray-500">{ret.distributorGSTIN}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{ret.store}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{ret.returnDate}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{ret.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{ret.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      ret.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      ret.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ret.status === 'pending' && '⏳ '}
                      {ret.status === 'approved' && '✅ '}
                      {ret.status === 'rejected' && '❌ '}
                      {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ret.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(ret.id, 'approved')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(ret.id, 'rejected')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">New Distributor Return</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="Store 1">Store 1</option>
                  <option value="Store 2">Store 2</option>
                  <option value="Store 3">Store 3</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Bill Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.billNumber}
                    onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="PB-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distributor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.distributorName}
                    onChange={(e) => setFormData({ ...formData, distributorName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="ABC Distributors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distributor GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.distributorGSTIN}
                    onChange={(e) => setFormData({ ...formData, distributorGSTIN: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="27AABCU9603R1ZM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Return <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="e.g., Damaged goods, Excess stock, Quality issues"
                  required
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Return Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-12 md:col-span-3">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Product Name"
                          required
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="HSN"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Qty"
                          required
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <input
                          type="number"
                          value={item.rate || ''}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Rate"
                          required
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <input
                          type="number"
                          value={item.gst || ''}
                          onChange={(e) => handleItemChange(index, 'gst', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="GST%"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-1">
                        <div className="text-sm font-medium text-gray-700 px-2 py-1">
                          ₹{calculateItemAmount(item).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm text-indigo-800">Total Return Amount</p>
                  <p className="text-2xl font-bold text-indigo-900">₹{calculateTotal().toFixed(2)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}