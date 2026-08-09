import { useCallback, useMemo, useState } from 'react';
import { Plus, Eye, Send, Download, Search, Calendar, Edit2, CheckCircle, XCircle, Printer, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import logoImg from '../../assets/logo.jpg';

export default function InvoiceManagement({ user }) {
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-001',
      date: '2026-04-20',
      customer: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      store: 'Store 1',
      items: [
        { product: 'LED TV 43"', quantity: 1, price: 25999 },
        { product: 'Washing Machine 7kg', quantity: 1, price: 18999 },
        { product: 'Microwave Oven', quantity: 1, price: 7999 }
      ],
      total: 52997,
      status: 'Approved',
      sentToWhatsApp: true,
      createdBy: 'Sales Person 1'
    },
    {
      id: 'INV-002',
      date: '2026-04-21',
      customer: 'Priya Sharma',
      phone: '+91 98765 43211',
      store: 'Store 1',
      items: [
        { product: 'Refrigerator 190L', quantity: 1, price: 15999 },
        { product: 'Air Cooler', quantity: 2, price: 8999 }
      ],
      total: 33997,
      status: 'Pending',
      sentToWhatsApp: false,
      createdBy: 'Sales Person 1'
    },
    {
      id: 'INV-003',
      date: '2026-04-22',
      customer: 'Amit Patel',
      phone: '+91 98765 43212',
      store: 'Store 1',
      items: [
        { product: 'Refrigerator 190L', quantity: 1, price: 15999 }
      ],
      total: 15999,
      status: 'Pending',
      sentToWhatsApp: false,
      createdBy: 'Sales Person 1'
    },
    {
      id: 'INV-004',
      date: '2026-04-23',
      customer: 'Sneha Desai',
      phone: '+91 98765 43213',
      store: 'Store 1',
      items: [
        { product: 'LED TV 43"', quantity: 1, price: 25999 },
        { product: 'Microwave Oven', quantity: 1, price: 7999 }
      ],
      total: 33998,
      status: 'Pending',
      sentToWhatsApp: false,
      createdBy: 'Sales Person 1'
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [approvingInvoice, setApprovingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer: '',
    phone: '',
    store: user.role === 'admin' ? 'Store 1' : (user.storeId ? `Store ${user.storeId}` : 'Store 1'),
    items: [{ product: '', quantity: 1, price: 0 }]
  });

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

  const handleEditItemChange = (index, field, value) => {
    if (!editingInvoice) return;
    const newItems = [...editingInvoice.items];
    newItems[index] = { ...newItems[index], [field]: field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value };
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setEditingInvoice({ ...editingInvoice, items: newItems, total: newTotal });
  };

  const handleAddEditItem = () => {
    if (!editingInvoice) return;
    setEditingInvoice({
      ...editingInvoice,
      items: [...editingInvoice.items, { product: '', quantity: 1, price: 0 }]
    });
  };

  const handleRemoveEditItem = (index) => {
    if (!editingInvoice) return;
    const newItems = editingInvoice.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setEditingInvoice({ ...editingInvoice, items: newItems, total: newTotal });
  };

  const calculateTotal = useCallback(() => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [formData.items]);

  // Recomputed once per render instead of once per each JSX read below
  const formTotal = useMemo(() => calculateTotal(), [calculateTotal]);

  const handleCreateInvoice = () => {
    if (formData.customer && formData.phone && formData.items.length > 0 && formData.items.every(i => i.product)) {
      const newInvoice = {
        id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        customer: formData.customer,
        phone: formData.phone,
        store: formData.store,
        items: formData.items,
        total: calculateTotal(),
        status: user.role === 'manager' ? 'Approved' : 'Pending',
        sentToWhatsApp: false,
        createdBy: user.name
      };
      setInvoices([newInvoice, ...invoices]);
      setFormData({ customer: '', phone: '', store: user.storeId ? `Store ${user.storeId}` : 'Store 1', items: [{ product: '', quantity: 1, price: 0 }] });
      setShowCreateModal(false);
      toast.success('Invoice created successfully!');
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const handleApproveInvoice = (invoice) => {
    setApprovingInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelected = (paymentMethod) => {
    if (!approvingInvoice) return;

    setInvoices(invoices.map(inv =>
      inv.id === approvingInvoice.id ? { ...inv, status: 'Approved', paymentMethod } : inv
    ));
    setShowPaymentModal(false);
    setApprovingInvoice(null);
    toast.success(`Invoice ${approvingInvoice.id} approved with ${paymentMethod} payment!`);
  };

  const handleRejectInvoice = (invoice) => {
    setInvoices(invoices.map(inv =>
      inv.id === invoice.id ? { ...inv, status: 'Rejected' } : inv
    ));
    toast.error(`Invoice ${invoice.id} rejected!`);
  };

  const handleSaveEdit = () => {
    if (!editingInvoice) return;
    if (editingInvoice.items.some(item => !item.product || item.quantity <= 0 || item.price <= 0)) {
      toast.error('Please fill all item details correctly');
      return;
    }
    setInvoices(invoices.map(inv =>
      inv.id === editingInvoice.id ? editingInvoice : inv
    ));
    setShowEditModal(false);
    setEditingInvoice(null);
    toast.success('Invoice updated successfully!');
  };

  const handlePrintInvoice = (invoice) => {
    toast.success(`Printing invoice ${invoice.id}...`);
    window.print();
  };

  const handleSendToWhatsApp = (invoice) => {
    const message = `Hello ${invoice.customer}! Your invoice ${invoice.id} for ₹${invoice.total.toLocaleString()} is ready. Thank you for shopping with Happy Home!`;
    const whatsappUrl = `https://wa.me/${invoice.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    setInvoices(invoices.map(inv =>
      inv.id === invoice.id ? { ...inv, sentToWhatsApp: true } : inv
    ));
    toast.success(`Invoice ${invoice.id} sent to ${invoice.phone} via WhatsApp!`);
  };

  const filteredInvoices = useMemo(() => invoices.filter(inv => {
    const matchesSearch = inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.phone.includes(searchTerm);
    const matchesStore = user.role === 'admin' || (user.storeId && inv.store === `Store ${user.storeId}`);
    return matchesSearch && matchesStore;
  }), [invoices, searchTerm, user.role, user.storeId]);

  const pendingInvoices = useMemo(() => filteredInvoices.filter(inv => inv.status === 'Pending'), [filteredInvoices]);
  const approvedInvoices = useMemo(() => filteredInvoices.filter(inv => inv.status === 'Approved' || inv.status === 'Paid'), [filteredInvoices]);
  const rejectedInvoices = useMemo(() => filteredInvoices.filter(inv => inv.status === 'Rejected'), [filteredInvoices]);

  // Manager View - Card-based approval system
  if (user.role === 'manager') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Invoice Approval</h2>
            <p className="text-gray-600 mt-1">Review and approve invoices from your team</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Create Invoice
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{filteredInvoices.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
            <p className="text-yellow-700 text-sm">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{pendingInvoices.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
            <p className="text-green-600 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{approvedInvoices.length}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
            <p className="text-red-600 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{rejectedInvoices.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by invoice number, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Pending Invoices - Card View */}
        {pendingInvoices.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {pendingInvoices.length}
              </span>
              Pending Approval
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingInvoices.map((invoice) => (
                <div key={invoice.id} className="bg-white rounded-xl shadow-lg border-2 border-yellow-200 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">{invoice.id}</h4>
                      <span className="bg-white text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm opacity-90 mt-1">{invoice.date}</p>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium text-gray-800">{invoice.customer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-800">{invoice.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="font-medium text-gray-800">{invoice.items.length} item(s)</p>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-amber-600">₹{invoice.total.toLocaleString()}</p>
                    </div>

                    {invoice.createdBy && (
                      <div className="text-xs text-gray-500">
                        Created by: {invoice.createdBy}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <button
                        onClick={() => {
                          setEditingInvoice(invoice);
                          setShowEditModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowViewModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApproveInvoice(invoice)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectInvoice(invoice)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Invoices */}
        {approvedInvoices.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {approvedInvoices.length}
              </span>
              Approved Invoices
            </h3>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Invoice #</th>
                      <th className="px-4 py-3 text-left text-sm">Customer</th>
                      <th className="px-4 py-3 text-left text-sm">Phone</th>
                      <th className="px-4 py-3 text-left text-sm">Date</th>
                      <th className="px-4 py-3 text-right text-sm">Total</th>
                      <th className="px-4 py-3 text-center text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{invoice.id}</td>
                        <td className="px-4 py-3 text-gray-800">{invoice.customer}</td>
                        <td className="px-4 py-3 text-gray-600">{invoice.phone}</td>
                        <td className="px-4 py-3 text-gray-600">{invoice.date}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">₹{invoice.total.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowViewModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handlePrintInvoice(invoice)}
                              className="p-2 hover:bg-purple-50 rounded-lg text-purple-600"
                              title="Print"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => handleSendToWhatsApp(invoice)}
                              className={`p-2 rounded-lg ${
                                invoice.sentToWhatsApp
                                  ? 'bg-green-50 text-green-600'
                                  : 'hover:bg-green-50 text-green-600'
                              }`}
                              title={invoice.sentToWhatsApp ? 'Sent to WhatsApp' : 'Send to WhatsApp'}
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Invoice</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Store</label>
                  <input
                    type="text"
                    value={formData.store}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Items *</label>
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
                    <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-12 md:col-span-5">
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
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Price</label>
                        <input
                          type="number"
                          value={item.price}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-2">
                        {formData.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <Trash2 size={14} />
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
                  <span className="text-2xl font-bold text-amber-600">₹{formTotal.toLocaleString()}</span>
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
                  onClick={handleCreateInvoice}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Invoice Modal */}
        {showEditModal && editingInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Invoice - {editingInvoice.id}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={editingInvoice.customer}
                    onChange={(e) => setEditingInvoice({...editingInvoice, customer: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={editingInvoice.phone}
                    onChange={(e) => setEditingInvoice({...editingInvoice, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <button
                    onClick={handleAddEditItem}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {editingInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-12 md:col-span-5">
                        <label className="block text-xs text-gray-600 mb-1">Product</label>
                        <input
                          type="text"
                          value={item.product}
                          onChange={(e) => handleEditItemChange(index, 'product', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Price</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleEditItemChange(index, 'price', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-2">
                        {editingInvoice.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveEditItem(index)}
                            className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1"
                          >
                            <Trash2 size={14} />
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
                  <span className="text-2xl font-bold text-amber-600">₹{editingInvoice.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingInvoice(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Invoice Modal */}
        {showViewModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <img
                  src={logoImg}
                  alt="Happy Home"
                  className="w-24 h-24 mx-auto mb-4"
                />
                <h2 className="text-3xl font-bold text-gray-800">Happy Home</h2>
                <p className="text-gray-600">Invoice {selectedInvoice.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Customer:</p>
                  <p className="font-medium text-gray-800">{selectedInvoice.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone:</p>
                  <p className="font-medium text-gray-800">{selectedInvoice.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="font-medium text-gray-800">{selectedInvoice.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Store:</p>
                  <p className="font-medium text-gray-800">{selectedInvoice.store}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">Items</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Product</th>
                        <th className="px-4 py-2 text-center text-sm">Qty</th>
                        <th className="px-4 py-2 text-right text-sm">Price</th>
                        <th className="px-4 py-2 text-right text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">{item.product}</td>
                          <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right">₹{item.price.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">₹{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center py-4">
                  <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                  <span className="text-3xl font-bold text-amber-600">₹{selectedInvoice.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedInvoice.status === 'Approved' || selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    selectedInvoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={() => handleSendToWhatsApp(selectedInvoice)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Send size={18} />
                  Send PDF
                </button>
              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="w-full mt-3 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin View - Original table view (keep as is for admin)
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Invoice Management</h2>
          <p className="text-gray-600 mt-1">Create and manage customer invoices</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">₹{invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-600 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedInvoices.length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
          <p className="text-orange-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingInvoices.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by invoice number, customer name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Invoice #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Store</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{invoice.id}</td>
                  <td className="px-4 py-3 text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {invoice.date}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{invoice.customer}</td>
                  <td className="px-4 py-3 text-gray-600">{invoice.phone}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {invoice.store}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{invoice.items.length}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">₹{invoice.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Approved' || invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowViewModal(true);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="View Invoice"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleSendToWhatsApp(invoice)}
                        className={`p-2 rounded-lg transition-colors ${
                          invoice.sentToWhatsApp
                            ? 'bg-green-50 text-green-600'
                            : 'hover:bg-green-50 text-green-600'
                        }`}
                        title={invoice.sentToWhatsApp ? 'Sent to WhatsApp' : 'Send to WhatsApp'}
                      >
                        <Send size={16} />
                      </button>
                      <button
                        onClick={() => handlePrintInvoice(invoice)}
                        className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals same as manager view */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Invoice</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({...formData, customer: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="md:col-span-2">
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
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Items *</label>
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
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-12 md:col-span-5">
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
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-xs text-gray-600 mb-1">Price</label>
                      <input
                        type="number"
                        value={item.price}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={14} />
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
                <span className="text-2xl font-bold text-amber-600">₹{formTotal.toLocaleString()}</span>
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
                onClick={handleCreateInvoice}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <img
                src={logoImg}
                alt="Happy Home"
                className="w-24 h-24 mx-auto mb-4"
              />
              <h2 className="text-3xl font-bold text-gray-800">Happy Home</h2>
              <p className="text-gray-600">Invoice {selectedInvoice.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Customer:</p>
                <p className="font-medium text-gray-800">{selectedInvoice.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone:</p>
                <p className="font-medium text-gray-800">{selectedInvoice.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date:</p>
                <p className="font-medium text-gray-800">{selectedInvoice.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Store:</p>
                <p className="font-medium text-gray-800">{selectedInvoice.store}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Items</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm">Product</th>
                      <th className="px-4 py-2 text-center text-sm">Qty</th>
                      <th className="px-4 py-2 text-right text-sm">Price</th>
                      <th className="px-4 py-2 text-right text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{item.product}</td>
                        <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">₹{item.price.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">₹{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center py-4">
                <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                <span className="text-3xl font-bold text-amber-600">₹{selectedInvoice.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedInvoice.status === 'Approved' || selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                  selectedInvoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowViewModal(false)}
              className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentModal && approvingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Select Payment Method</h3>
              <p className="text-gray-600">How did the customer pay for this invoice?</p>
            </div>

            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Invoice:</span>
                <span className="font-medium text-gray-800">{approvingInvoice.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="font-medium text-gray-800">{approvingInvoice.customer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-xl font-bold text-green-600">₹{approvingInvoice.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handlePaymentMethodSelected('Cash')}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">Cash Payment</p>
                    <p className="text-sm text-gray-600">Customer paid in cash</p>
                  </div>
                </div>
                <CheckCircle className="text-gray-300 group-hover:text-green-600" size={24} />
              </button>

              <button
                onClick={() => handlePaymentMethodSelected('UPI')}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                    <Send className="text-blue-600" size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">UPI Payment</p>
                    <p className="text-sm text-gray-600">Customer paid via UPI</p>
                  </div>
                </div>
                <CheckCircle className="text-gray-300 group-hover:text-blue-600" size={24} />
              </button>
            </div>

            <button
              onClick={() => {
                setShowPaymentModal(false);
                setApprovingInvoice(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}