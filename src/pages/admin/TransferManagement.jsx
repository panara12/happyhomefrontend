import { useState } from 'react';
import { Plus, ArrowRight, CheckCircle, Clock, XCircle, Search, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

export default function TransferManagement({ user }) {
  const [transfers, setTransfers] = useState([
    {
      id: 'TRF-001',
      date: '2026-04-20',
      fromStore: 'Store 1',
      toStore: 'Store 2',
      product: 'LED TV 43"',
      quantity: 5,
      status: 'Completed',
      requestedBy: 'Manager 1',
      approvedBy: 'Admin User'
    },
    {
      id: 'TRF-002',
      date: '2026-04-21',
      fromStore: 'Store 2',
      toStore: 'Store 3',
      product: 'Washing Machine 7kg',
      quantity: 3,
      status: 'Pending',
      requestedBy: 'Manager 2',
      approvedBy: '-'
    },
    {
      id: 'TRF-003',
      date: '2026-04-22',
      fromStore: 'Store 1',
      toStore: 'Store 3',
      product: 'Microwave Oven',
      quantity: 8,
      status: 'In Transit',
      requestedBy: 'Manager 1',
      approvedBy: 'Admin User'
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fromStore: user.role === 'manager' && user.storeId ? `Store ${user.storeId}` : 'Store 1',
    toStore: user.role === 'manager' && user.storeId ? (user.storeId === 1 ? 'Store 2' : 'Store 1') : 'Store 2',
    product: '',
    quantity: 1,
    reason: ''
  });

  const mockProducts = [
    'LED TV 43"',
    'Refrigerator 190L',
    'Washing Machine 7kg',
    'Microwave Oven',
    'Air Cooler'
  ];

  const handleCreateTransfer = () => {
    if (formData.product && formData.quantity > 0 && formData.fromStore !== formData.toStore) {
      const newTransfer = {
        id: `TRF-${String(transfers.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        fromStore: formData.fromStore,
        toStore: formData.toStore,
        product: formData.product,
        quantity: formData.quantity,
        status: 'Pending',
        requestedBy: user.name,
        approvedBy: '-'
      };
      setTransfers([newTransfer, ...transfers]);
      setFormData({ fromStore: 'Store 1', toStore: 'Store 2', product: '', quantity: 1, reason: '' });
      setShowCreateModal(false);
      toast.success('Transfer request created successfully!');
    } else if (formData.fromStore === formData.toStore) {
      toast.error('Source and destination stores must be different!');
    }
  };

  const handleApproveTransfer = (id) => {
    setTransfers(transfers.map(t =>
      t.id === id ? { ...t, status: 'In Transit', approvedBy: user.name } : t
    ));
    toast.success(user.role === 'admin' ? 'Transfer approved!' : 'Transfer request accepted!');
  };

  const handleCompleteTransfer = (id) => {
    setTransfers(transfers.map(t =>
      t.id === id ? { ...t, status: 'Completed' } : t
    ));
    toast.success('Transfer completed!');
  };

  const handleRejectTransfer = (id) => {
    const transfer = transfers.find(t => t.id === id);
    const canReject = user.role === 'admin' || (transfer && user.storeId && transfer.toStore === `Store ${user.storeId}`);

    if (canReject && confirm('Are you sure you want to reject this transfer?')) {
      setTransfers(transfers.filter(t => t.id !== id));
      toast.success('Transfer rejected!');
    }
  };

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.fromStore.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.toStore.toLowerCase().includes(searchTerm.toLowerCase());
    // Managers can see all transfers (to view and accept requests to their store)
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return { bg: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> };
      case 'In Transit':
        return { bg: 'bg-blue-100 text-blue-700', icon: <Clock size={16} /> };
      case 'Pending':
        return { bg: 'bg-orange-100 text-orange-700', icon: <Clock size={16} /> };
      default:
        return { bg: 'bg-gray-100 text-gray-700', icon: <XCircle size={16} /> };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Store Transfers</h2>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin'
              ? 'Manage inventory transfers between stores'
              : 'Request and accept inventory transfers'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Create Transfer Request
        </button>
      </div>

      {/* Info Banner for Managers */}
      {user.role === 'manager' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 text-white p-2 rounded-lg">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Transfer Management Permissions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Request transfers</strong> from your store to other stores</li>
                <li>• <strong>Accept or decline</strong> incoming transfer requests to your store</li>
                <li>• <strong>Mark as received</strong> when items arrive at your store</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Transfers</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{filteredTransfers.length}</p>
        </div>
        {user.role === 'manager' ? (
          <>
            <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
              <p className="text-green-600 text-sm">📥 Incoming Requests</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {user.storeId ? filteredTransfers.filter(t => t.toStore === `Store ${user.storeId}` && t.status === 'Pending').length : 0}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
              <p className="text-blue-600 text-sm">📤 Outgoing Requests</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {user.storeId ? filteredTransfers.filter(t => t.fromStore === `Store ${user.storeId}` && t.status === 'Pending').length : 0}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg shadow p-4 border border-purple-200">
              <p className="text-purple-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {user.storeId ? filteredTransfers.filter(t => (t.fromStore === `Store ${user.storeId}` || t.toStore === `Store ${user.storeId}`) && t.status === 'Completed').length : 0}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
              <p className="text-orange-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{transfers.filter(t => t.status === 'Pending').length}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
              <p className="text-blue-600 text-sm">In Transit</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{transfers.filter(t => t.status === 'In Transit').length}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
              <p className="text-green-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{transfers.filter(t => t.status === 'Completed').length}</p>
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search transfers by ID, product, or store..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Transfers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTransfers.map(transfer => {
          const statusBadge = getStatusBadge(transfer.status);
          const isIncoming = user.role === 'manager' && user.storeId && transfer.toStore === `Store ${user.storeId}`;
          const isOutgoing = user.role === 'manager' && user.storeId && transfer.fromStore === `Store ${user.storeId}`;

          return (
            <div key={transfer.id} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 ${
              isIncoming ? 'border-l-4 border-green-500' : isOutgoing ? 'border-l-4 border-blue-500' : ''
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{transfer.id}</h3>
                  <p className="text-sm text-gray-600">{transfer.date}</p>
                  {user.role === 'manager' && user.storeId && (
                    <span className={`inline-block mt-1 text-xs font-medium ${
                      isIncoming ? 'text-green-600' : isOutgoing ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {isIncoming ? '📥 Incoming Request' : isOutgoing ? '📤 Outgoing Request' : '🔄 Other Store'}
                    </span>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.bg}`}>
                  {statusBadge.icon}
                  {transfer.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">From</p>
                    <p className="font-medium text-gray-800">{transfer.fromStore}</p>
                  </div>
                  <ArrowRight className="text-amber-600 mx-4" size={24} />
                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-500 mb-1">To</p>
                    <p className="font-medium text-gray-800">{transfer.toStore}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium text-gray-800">{transfer.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-bold text-amber-600">{transfer.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested By:</span>
                  <span className="text-gray-800">{transfer.requestedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved By:</span>
                  <span className="text-gray-800">{transfer.approvedBy}</span>
                </div>
              </div>

              {transfer.status === 'Pending' && (
                <div className="pt-4 border-t border-gray-200">
                  {user.role === 'admin' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveTransfer(transfer.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(transfer.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  ) : user.storeId && transfer.toStore === `Store ${user.storeId}` ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveTransfer(transfer.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Accept Request
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(transfer.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} />
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-sm text-gray-600">
                      Waiting for receiving store approval
                    </div>
                  )}
                </div>
              )}

              {transfer.status === 'In Transit' && (
                <div className="pt-4 border-t border-gray-200">
                  {(user.role === 'admin' || (user.storeId && transfer.toStore === `Store ${user.storeId}`)) ? (
                    <button
                      onClick={() => handleCompleteTransfer(transfer.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Mark as Received
                    </button>
                  ) : (
                    <div className="text-center py-2 text-sm text-gray-600">
                      Transfer in transit - waiting for receiving store confirmation
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Transfer Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Store</label>
                <select
                  value={formData.fromStore}
                  onChange={(e) => setFormData({...formData, fromStore: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">To Store</label>
                <select
                  value={formData.toStore}
                  onChange={(e) => setFormData({...formData, toStore: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  {user.role === 'admin' ? (
                    <>
                      <option value="Store 1">Store 1</option>
                      <option value="Store 2">Store 2</option>
                      <option value="Store 3">Store 3</option>
                    </>
                  ) : user.storeId ? (
                    <>
                      {user.storeId !== 1 && <option value="Store 1">Store 1</option>}
                      {user.storeId !== 2 && <option value="Store 2">Store 2</option>}
                      {user.storeId !== 3 && <option value="Store 3">Store 3</option>}
                    </>
                  ) : (
                    <>
                      <option value="Store 1">Store 1</option>
                      <option value="Store 2">Store 2</option>
                      <option value="Store 3">Store 3</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={formData.product}
                  onChange={(e) => setFormData({...formData, product: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Product</option>
                  {mockProducts.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Why is this transfer needed?"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTransfer}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Create Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}