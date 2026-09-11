import { useMemo, useState, useCallback } from 'react';
import { Plus, Eye, Send, Download, Search, Calendar, Edit2, CheckCircle, XCircle, Printer, Trash2, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoImg from '../../assets/logo.jpg';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import {
  useGetMyInvoices,
  useGetStoreInvoices,
  useSubmitInvoice,
  useUpdateInvoiceStatus,
  useUpdateInvoice,
} from '../../hooks/useInvoice';

/**
 * NOTE ON DATA THIS COMPONENT DOESN'T OWN
 * ----------------------------------------
 * The backend only lets you submit an invoice for an EXISTING customerId, and
 * items reference an existing productId. No hooks for "search/create customer"
 * or "list products" were provided, so this component takes them as props:
 *
 *   <InvoiceManagement user={user} customers={customers} products={products} />
 *
 *   customers: [{ _id, name, phone }]
 *   products : [{ _id, sku_code | product_code | barcode_text, price }]
 *
 * Wire those up to whatever hooks/endpoints your app already uses for the
 * customer and product lists (e.g. useGetCustomers / useGetProducts). Until
 * then the create-invoice form will show an empty picker.
 */

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const statusBadgeClass = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const productLabel = (product) =>
  product?.product_code || product?.sku_code || product?.barcode_text || product?._id;

const emptyItem = () => ({ productId: '', quantity: 1, price: 0 });

export default function InvoiceManagement({ user, customers = [], products = [] }) {
  const isManagerOrAdmin = user.userType === 'manager' || user.userType === 'admin';
  const isManager = user.userType === 'manager';

  // --- Data fetching ---------------------------------------------------
  const myInvoicesQuery = useGetMyInvoices({ limit: 100 }, { enabled: !isManagerOrAdmin });
  const storeInvoicesQuery = useGetStoreInvoices({ limit: 100 }, { enabled: isManagerOrAdmin });

  const activeQuery = isManagerOrAdmin ? storeInvoicesQuery : myInvoicesQuery;
  const invoices = activeQuery.data?.invoices ?? [];
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  // --- Mutations ---------------------------------------------------------
  const submitInvoiceMutation = useSubmitInvoice();
  const updateStatusMutation = useUpdateInvoiceStatus();
  const updateInvoiceMutation = useUpdateInvoice();

  // --- UI state ------------------------------------------------------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [approvingInvoice, setApprovingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    items: [emptyItem()],
  });

  // --- Create form helpers ---------------------------------------------
  const handleAddItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      if (field === 'productId') {
        const product = products.find((p) => p._id === value);
        items[index] = { ...items[index], productId: value, price: Number(product?.price || 0) };
      } else {
        items[index] = { ...items[index], [field]: value };
      }
      return { ...prev, items };
    });
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    setFormData((prev) => ({
      ...prev,
      customerId,
      customerName: customer?.name || '',
      phone: customer?.phone || '',
    }));
  };

  const calculateTotal = useCallback(
    () => formData.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 0), 0),
    [formData.items]
  );
  const formSubtotal = useMemo(() => calculateTotal(), [calculateTotal]);
  const formTax = useMemo(() => Number((formSubtotal * 0.18).toFixed(2)), [formSubtotal]);
  const formTotal = useMemo(() => Number((formSubtotal + formTax).toFixed(2)), [formSubtotal, formTax]);

  const resetCreateForm = () =>
    setFormData({ customerId: '', customerName: '', phone: '', items: [emptyItem()] });

  const handleCreateInvoice = async () => {
    if (!formData.customerId) {
      toast.error('Select a customer (create them first if they are not in the list yet)');
      return;
    }
    if (formData.items.length === 0 || formData.items.some((i) => !i.productId || Number(i.quantity) <= 0)) {
      toast.error('Please fill all item details correctly');
      return;
    }

    const items = formData.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      price: Number(item.price),
      total: Number((Number(item.price) * Number(item.quantity)).toFixed(2)),
      gst: 18,
    }));

    try {
      await submitInvoiceMutation.mutateAsync({
        customerId: formData.customerId,
        storeId: user.storeId,
        items,
        summary: { subtotal: formSubtotal, tax: formTax, total: formTotal },
      });
      resetCreateForm();
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create invoice');
    }
  };

  // --- Approve / reject --------------------------------------------------
  const handleApproveInvoice = (invoice) => {
    setApprovingInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelected = async (paymentMethod) => {
    if (!approvingInvoice) return;
    try {
      // Note: the backend's update-status endpoint only stores `status` right
      // now, there's no paymentMethod field on the Invoice model yet — this
      // is captured here for UX but won't persist until the backend adds it.
      await updateStatusMutation.mutateAsync({ id: approvingInvoice._id, status: 'approved' });
      toast.success(`Invoice ${approvingInvoice.invoiceNumber} approved (${paymentMethod})`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve invoice');
    } finally {
      setShowPaymentModal(false);
      setApprovingInvoice(null);
    }
  };

  const handleRejectInvoice = async (invoice) => {
    try {
      await updateStatusMutation.mutateAsync({ id: invoice._id, status: 'rejected' });
      toast.success(`Invoice ${invoice.invoiceNumber} rejected`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reject invoice');
    }
  };

  // --- Edit --------------------------------------------------------------
  const openEditModal = (invoice) => {
    setEditingInvoice({
      ...invoice,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      items: invoice.items.map((item) => ({ ...item })),
    });
    setShowEditModal(true);
  };

  const handleEditItemChange = (index, field, value) => {
    if (!editingInvoice) return;
    const items = [...editingInvoice.items];
    items[index] = {
      ...items[index],
      [field]: field === 'quantity' || field === 'price' ? Number(value) || 0 : value,
    };
    items[index].total = Number((items[index].price * items[index].quantity).toFixed(2));
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = Number((subtotal * 0.18).toFixed(2));
    setEditingInvoice({ ...editingInvoice, items, subtotal, tax, total: Number((subtotal + tax).toFixed(2)) });
  };

  const handleAddEditItem = () => {
    if (!editingInvoice) return;
    setEditingInvoice({ ...editingInvoice, items: [...editingInvoice.items, { productId: '', quantity: 1, price: 0, total: 0 }] });
  };

  const handleRemoveEditItem = (index) => {
    if (!editingInvoice) return;
    const items = editingInvoice.items.filter((_, i) => i !== index);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = Number((subtotal * 0.18).toFixed(2));
    setEditingInvoice({ ...editingInvoice, items, subtotal, tax, total: Number((subtotal + tax).toFixed(2)) });
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;
    if (editingInvoice.items.some((item) => !item.productId || item.quantity <= 0 || item.price <= 0)) {
      toast.error('Please fill all item details correctly');
      return;
    }
    try {
      await updateInvoiceMutation.mutateAsync({
        id: editingInvoice._id,
        customerName: editingInvoice.customerName,
        customerPhone: editingInvoice.customerPhone,
        items: editingInvoice.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          gst: item.gst ?? 18,
        })),
      });
      setShowEditModal(false);
      setEditingInvoice(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update invoice');
    }
  };

  // --- Print / WhatsApp (unchanged, just uses the real field names) ------
  const handlePrintInvoice = (invoice) => {
    toast.success(`Printing invoice ${invoice.invoiceNumber}...`);
    window.print();
  };

  const handleSendToWhatsApp = (invoice) => {
    const message = `Hello ${invoice.customerName}! Your invoice ${invoice.invoiceNumber} for ₹${invoice.total.toLocaleString()} is ready. Thank you for shopping with Happy Home!`;
    const whatsappUrl = `https://wa.me/${(invoice.customerPhone || '').replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success(`Invoice ${invoice.invoiceNumber} opened in WhatsApp`);
  };

  // --- Filtering / sectioning ---------------------------------------
  const filteredInvoices = useMemo(
    () =>
      invoices.filter((inv) => {
        const term = searchTerm.toLowerCase();
        return (
          (inv.customerName || '').toLowerCase().includes(term) ||
          (inv.invoiceNumber || '').toLowerCase().includes(term) ||
          (inv.customerPhone || '').includes(searchTerm)
        );
      }),
    [invoices, searchTerm]
  );

  const pendingInvoices = useMemo(() => filteredInvoices.filter((inv) => inv.status === 'pending'), [filteredInvoices]);
  const approvedInvoices = useMemo(() => filteredInvoices.filter((inv) => inv.status === 'approved'), [filteredInvoices]);
  const rejectedInvoices = useMemo(() => filteredInvoices.filter((inv) => inv.status === 'rejected'), [filteredInvoices]);

  const pendingInvoicesPagination = usePagination(pendingInvoices);
  const approvedInvoicesPagination = usePagination(approvedInvoices);
  const allInvoicesPagination = usePagination(filteredInvoices);

  const isMutating = submitInvoiceMutation.isPending || updateStatusMutation.isPending || updateInvoiceMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
        <Loader2 className="animate-spin" size={20} />
        Loading invoices...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-600 gap-2">
        <p>Failed to load invoices.</p>
        <button
          onClick={() => activeQuery.refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // ======================================================================
  // Manager view — card-based approval board
  // ======================================================================
  if (isManager) {
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

        {pendingInvoices.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {pendingInvoices.length}
              </span>
              Pending Approval
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingInvoicesPagination.paginatedItems.map((invoice) => (
                <div key={invoice._id} className="bg-white rounded-xl shadow-lg border-2 border-yellow-200 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">{invoice.invoiceNumber}</h4>
                      <span className="bg-white text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm opacity-90 mt-1">
                      {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium text-gray-800">{invoice.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-800">{invoice.customerPhone}</p>
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
                      <div className="text-xs text-gray-500">Created by: {invoice.createdBy}</div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <button
                        onClick={() => openEditModal(invoice)}
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
                        disabled={isMutating}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectInvoice(invoice)}
                        disabled={isMutating}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={pendingInvoicesPagination.page}
              totalPages={pendingInvoicesPagination.totalPages}
              totalItems={pendingInvoicesPagination.totalItems}
              pageSize={pendingInvoicesPagination.pageSize}
              onPageChange={pendingInvoicesPagination.goToPage}
            />
          </div>
        )}

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
                    {approvedInvoicesPagination.paginatedItems.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3 text-gray-800">{invoice.customerName}</td>
                        <td className="px-4 py-3 text-gray-600">{invoice.customerPhone}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : ''}
                        </td>
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
                              className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                              title="Send to WhatsApp"
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
              <Pagination
                page={approvedInvoicesPagination.page}
                totalPages={approvedInvoicesPagination.totalPages}
                totalItems={approvedInvoicesPagination.totalItems}
                pageSize={approvedInvoicesPagination.pageSize}
                onPageChange={approvedInvoicesPagination.goToPage}
              />
            </div>
          </div>
        )}

        {renderCreateModal()}
        {renderEditModal()}
        {renderViewModal()}
        {renderPaymentModal()}
      </div>
    );
  }

  // ======================================================================
  // Admin / sales person view — table view
  // ======================================================================
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{filteredInvoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            ₹{filteredInvoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
          </p>
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

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Invoice #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allInvoicesPagination.paginatedItems.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{invoice.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{invoice.customerPhone}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{invoice.items.length}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">₹{invoice.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(invoice.status)}`}>
                      {STATUS_LABELS[invoice.status] || invoice.status}
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
                        className="p-2 rounded-lg transition-colors hover:bg-green-50 text-green-600"
                        title="Send to WhatsApp"
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
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => openEditModal(invoice)}
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600"
                          title="Edit Invoice"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={allInvoicesPagination.page}
          totalPages={allInvoicesPagination.totalPages}
          totalItems={allInvoicesPagination.totalItems}
          pageSize={allInvoicesPagination.pageSize}
          onPageChange={allInvoicesPagination.goToPage}
        />
      </div>

      {renderCreateModal()}
      {renderEditModal()}
      {renderViewModal()}
      {renderPaymentModal()}
    </div>
  );

  // ======================================================================
  // Shared modals
  // ======================================================================
  function renderCreateModal() {
    if (!showCreateModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Invoice</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.phone}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No customer list wired up yet — pass a `customers` prop.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="Auto-filled from customer"
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
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {productLabel(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
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

          <div className="border-t border-gray-200 pt-4 mb-6 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{formSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (18%)</span>
              <span>₹{formTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xl font-bold text-gray-800">Total Amount:</span>
              <span className="text-2xl font-bold text-amber-600">₹{formTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={submitInvoiceMutation.isPending}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitInvoiceMutation.isPending && <Loader2 className="animate-spin" size={16} />}
              Create Invoice
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderEditModal() {
    if (!showEditModal || !editingInvoice) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Invoice - {editingInvoice.invoiceNumber}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                value={editingInvoice.customerName || ''}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={editingInvoice.customerPhone || ''}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, customerPhone: e.target.value })}
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
                    <select
                      value={item.productId}
                      onChange={(e) => handleEditItemChange(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {productLabel(p)}
                        </option>
                      ))}
                    </select>
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
              disabled={updateInvoiceMutation.isPending}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updateInvoiceMutation.isPending && <Loader2 className="animate-spin" size={16} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderViewModal() {
    if (!showViewModal || !selectedInvoice) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <img src={logoImg} alt="Happy Home" className="w-24 h-24 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800">Happy Home</h2>
            <p className="text-gray-600">Invoice {selectedInvoice.invoiceNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Customer:</p>
              <p className="font-medium text-gray-800">{selectedInvoice.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone:</p>
              <p className="font-medium text-gray-800">{selectedInvoice.customerPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date:</p>
              <p className="font-medium text-gray-800">
                {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : ''}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status:</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(selectedInvoice.status)}`}>
                {STATUS_LABELS[selectedInvoice.status] || selectedInvoice.status}
              </span>
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
                      <td className="px-4 py-2 text-sm">{item.productName}</td>
                      <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-right">₹{item.price.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium">₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{selectedInvoice.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax</span>
              <span>₹{selectedInvoice.tax?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-lg font-medium text-gray-700">Total Amount:</span>
              <span className="text-3xl font-bold text-amber-600">₹{selectedInvoice.total.toLocaleString()}</span>
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
    );
  }

  function renderPaymentModal() {
    if (!showPaymentModal || !approvingInvoice) return null;
    return (
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
              <span className="font-medium text-gray-800">{approvingInvoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Customer:</span>
              <span className="font-medium text-gray-800">{approvingInvoice.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-xl font-bold text-green-600">₹{approvingInvoice.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => handlePaymentMethodSelected('Cash')}
              disabled={updateStatusMutation.isPending}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group disabled:opacity-50"
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
              disabled={updateStatusMutation.isPending}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50"
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
    );
  }
}