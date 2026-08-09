import { useState } from 'react';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesReturn() {
  const [returns, setReturns] = useState([
    {
      id: 'SR-001',
      date: '2026-04-22',
      originalInvoice: 'INV-001',
      customer: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      store: 'Store 1',
      items: [
        { product: 'LED TV 43"', hsn: '8528', quantity: 1, rate: 25999, taxableValue: 25999, cgst: 2340, sgst: 2340 }
      ],
      subtotal: 25999,
      cgst: 2340,
      sgst: 2340,
      total: 30679,
      reason: 'Product Defective',
      status: 'Approved',
      refundMethod: 'Cash'
    },
    {
      id: 'SR-002',
      date: '2026-04-23',
      originalInvoice: 'INV-045',
      customer: 'Priya Sharma',
      phone: '+91 98765 43211',
      store: 'Store 2',
      items: [
        { product: 'Washing Machine 7kg', hsn: '8450', quantity: 1, rate: 18999, taxableValue: 18999, cgst: 1710, sgst: 1710 }
      ],
      subtotal: 18999,
      cgst: 1710,
      sgst: 1710,
      total: 22419,
      reason: 'Wrong Product Delivered',
      status: 'Pending',
      refundMethod: 'Bank Transfer'
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    originalInvoice: '',
    customer: '',
    phone: '',
    store: 'Store 1',
    reason: '',
    refundMethod: 'Cash',
    items: [{ product: '', hsn: '', quantity: 1, rate: 0, gstRate: 18 }]
  });

  const handleCreateReturn = () => {
    if (formData.originalInvoice && formData.customer && formData.reason) {
      const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      const gstAmount = formData.items.reduce((sum, item) => sum + ((item.quantity * item.rate * item.gstRate) / 100), 0);

      const newReturn = {
        id: `SR-${String(returns.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        originalInvoice: formData.originalInvoice,
        customer: formData.customer,
        phone: formData.phone,
        store: formData.store,
        items: formData.items.map(item => ({
          ...item,
          taxableValue: item.quantity * item.rate,
          cgst: ((item.quantity * item.rate * item.gstRate) / 100) / 2,
          sgst: ((item.quantity * item.rate * item.gstRate) / 100) / 2
        })),
        subtotal,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        total: subtotal + gstAmount,
        reason: formData.reason,
        status: 'Pending',
        refundMethod: formData.refundMethod
      };

      setReturns([newReturn, ...returns]);
      setFormData({
        originalInvoice: '',
        customer: '',
        phone: '',
        store: 'Store 1',
        reason: '',
        refundMethod: 'Cash',
        items: [{ product: '', hsn: '', quantity: 1, rate: 0, gstRate: 18 }]
      });
      setShowAddModal(false);
      toast.success('Sales return created successfully!');
    }
  };

  const handleApproveReturn = (id) => {
    setReturns(returns.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    toast.success('Return approved!');
  };

  const handleRejectReturn = (id) => {
    setReturns(returns.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    toast.error('Return rejected!');
  };

  const filteredReturns = returns.filter(ret =>
    ret.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.originalInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sales Returns</h2>
          <p className="text-gray-600 mt-1">Manage customer return requests</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Create Sales Return
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Returns</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{returns.length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
          <p className="text-orange-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{returns.filter(r => r.status === 'Pending').length}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-600 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{returns.filter(r => r.status === 'Approved').length}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
          <p className="text-red-600 text-sm">Total Refund Amount</p>
          <p className="text-2xl font-bold text-red-600 mt-1">₹{returns.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.total, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by customer, invoice, or return ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Returns Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredReturns.map(ret => (
          <div key={ret.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{ret.id}</h3>
                  <p className="text-sm text-gray-600">Original Invoice: {ret.originalInvoice}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                ret.status === 'Approved' ? 'bg-green-100 text-green-700' :
                ret.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {ret.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-medium text-gray-800">{ret.customer}</p>
                <p className="text-xs text-gray-600">{ret.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <p className="font-medium text-gray-800">{ret.date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Store</p>
                <p className="font-medium text-gray-800">{ret.store}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Refund Method</p>
                <p className="font-medium text-gray-800">{ret.refundMethod}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Return Reason:</p>
              <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{ret.reason}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium text-gray-800">₹{ret.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">GST (CGST + SGST):</span>
                <span className="font-medium text-gray-800">₹{(ret.cgst + ret.sgst).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-800">Total Refund:</span>
                <span className="text-2xl font-bold text-red-600">₹{ret.total.toLocaleString()}</span>
              </div>
            </div>

            {ret.status === 'Pending' && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApproveReturn(ret.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve Return
                </button>
                <button
                  onClick={() => handleRejectReturn(ret.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject Return
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Sales Return</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Original Invoice Number</label>
                <input
                  type="text"
                  value={formData.originalInvoice}
                  onChange={(e) => setFormData({...formData, originalInvoice: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="INV-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({...formData, customer: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store</label>
                <select
                  value={formData.store}
                  onChange={(e) => setFormData({...formData, store: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="Store 1">Store 1</option>
                  <option value="Store 2">Store 2</option>
                  <option value="Store 3">Store 3</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Return Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Describe the reason for return"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method</label>
                <select
                  value={formData.refundMethod}
                  onChange={(e) => setFormData({...formData, refundMethod: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Store Credit">Store Credit</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReturn}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Create Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}