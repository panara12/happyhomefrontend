import { useState } from 'react';
import { Plus, CheckCircle, Clock, XCircle, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseOrders({ user }) {
  const [orders, setOrders] = useState([
    {
      id: 'PO-001',
      date: '2026-04-18',
      supplier: 'Samsung India',
      store: 'Store 1',
      items: [
        { product: 'LED TV 43"', quantity: 10, price: 25999 }
      ],
      total: 259990,
      status: 'Received',
      expectedDate: '2026-04-25'
    },
    {
      id: 'PO-002',
      date: '2026-04-20',
      supplier: 'LG Electronics',
      store: 'Store 2',
      items: [
        { product: 'Refrigerator 190L', quantity: 8, price: 15999 }
      ],
      total: 127992,
      status: 'Pending',
      expectedDate: '2026-04-28'
    },
    {
      id: 'PO-003',
      date: '2026-04-21',
      supplier: 'IFB Industries',
      store: 'Store 1',
      items: [
        { product: 'Washing Machine 7kg', quantity: 12, price: 18999 }
      ],
      total: 227988,
      status: 'Approved',
      expectedDate: '2026-04-30'
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    supplier: '',
    store: user.role === 'manager' && user.storeId ? `Store ${user.storeId}` : 'Store 1',
    expectedDate: '',
    items: [{ product: '', quantity: 1, price: 0 }]
  });

  const mockSuppliers = [
    'Samsung India',
    'LG Electronics',
    'IFB Industries',
    'Bajaj Electricals',
    'Symphony Ltd'
  ];

  const mockProducts = [
    { name: 'LED TV 43"', price: 25999 },
    { name: 'Refrigerator 190L', price: 15999 },
    { name: 'Washing Machine 7kg', price: 18999 },
    { name: 'Microwave Oven', price: 7999 },
    { name: 'Air Cooler', price: 8999 },
  ];

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, price: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'product') {
      const product = mockProducts.find(p => p.name === value);
      newItems[index] = { product: value, quantity: newItems[index].quantity, price: product?.price || 0 };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreatePO = () => {
    if (formData.supplier && formData.expectedDate && formData.items.length > 0) {
      const newPO = {
        id: `PO-${String(orders.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        supplier: formData.supplier,
        store: formData.store,
        items: formData.items,
        total: calculateTotal(),
        status: 'Pending',
        expectedDate: formData.expectedDate
      };
      setOrders([newPO, ...orders]);
      setFormData({ supplier: '', store: 'Store 1', expectedDate: '', items: [{ product: '', quantity: 1, price: 0 }] });
      setShowCreateModal(false);
      toast.success('Purchase order created successfully!');
    }
  };

  const handleApprove = (id) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'Approved' } : o));
    toast.success('Purchase order approved!');
  };

  const handleReceive = (id) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'Received' } : o));
    toast.success('Purchase order marked as received!');
  };

  const handleCancel = (id) => {
    if (user.role === 'admin' && confirm('Are you sure you want to cancel this purchase order?')) {
      setOrders(orders.filter(o => o.id !== id));
      toast.success('Purchase order cancelled!');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    // Managers can only see their own store's POs
    const matchesStore = user.role === 'admin' || (user.storeId && o.store === `Store ${user.storeId}`);
    return matchesSearch && matchesStore;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Received':
        return { bg: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> };
      case 'Approved':
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
          <h2 className="text-3xl font-bold text-gray-800">Purchase Orders</h2>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin' ? 'Manage supplier purchase orders' : `Manage purchase orders for your store`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Create Purchase Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Orders</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{orders.length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
          <p className="text-orange-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{orders.filter(o => o.status === 'Pending').length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-blue-600 text-sm">Approved</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{orders.filter(o => o.status === 'Approved').length}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-600 text-sm">Received</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{orders.filter(o => o.status === 'Received').length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by PO number or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.map(order => {
          const statusBadge = getStatusBadge(order.status);
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Package className="text-amber-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{order.id}</h3>
                    <p className="text-sm text-gray-600">Order Date: {order.date}</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${statusBadge.bg} w-fit`}>
                  {statusBadge.icon}
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Supplier</p>
                  <p className="font-medium text-gray-800">{order.supplier}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Destination</p>
                  <p className="font-medium text-gray-800">{order.store}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expected Delivery</p>
                  <p className="font-medium text-gray-800">{order.expectedDate}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">Items:</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span className="text-gray-800">{item.product}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">Qty: {item.quantity}</span>
                      <span className="font-medium text-gray-800">₹{item.price.toLocaleString()}</span>
                      <span className="font-bold text-amber-600">₹{(item.quantity * item.price).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                <span className="text-2xl font-bold text-amber-600">₹{order.total.toLocaleString()}</span>
              </div>

              {order.status === 'Pending' && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  {user.role === 'admin' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-sm text-gray-600">
                      Waiting for admin approval
                    </div>
                  )}
                </div>
              )}

              {order.status === 'Approved' && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <button
                    onClick={() => handleReceive(order.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Mark as Received
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Purchase Order</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Supplier</option>
                  {mockSuppliers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination Store</label>
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <label className="block text-xs text-gray-600 mb-1">Product</label>
                      <select
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select Product</option>
                        {mockProducts.map(p => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                      <input
                        type="number"
                        value={item.price}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div className="col-span-2">
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">Total Amount:</span>
                <span className="text-2xl font-bold text-amber-600">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePO}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Create Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}