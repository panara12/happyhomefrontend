import { useCallback, useMemo, useState } from 'react';
import { Plus, CheckCircle, Clock, XCircle, Search, Package, Pencil, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreContext } from '../../context/storeContext';
import { useGetAllProducts } from '../../hooks/useProduct';
import {
  useAddPurchaseOrder,
  useEditPurchaseOrder,
  useUpdatePurchaseOrder,
  useGetAllPurchaseOrder,
} from '../../hooks/usePurchaseOrder';
import { useLoggedUserContext } from '../../context/loggedUserContext';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from '../../components/ui/Modal';

const emptyItem = { barcode_text: '', quantity: 1, matchedProduct: null };

function buildInitialForm(userRole, userStoreId) {
  return {
    supplierName: '',
    supplierMobile: '',
    storeId: userRole === 'manager' && userStoreId ? userStoreId : '',
    expectedDeliveryDate: '',
    items: [{ ...emptyItem }],
  };
}

export default function PurchaseOrders() {
  const { loggedUser: user } = useLoggedUserContext();
  const userRole = user.userType;

  const { stores } = useStoreContext();
  const { data: productsData } = useGetAllProducts();
  const products = productsData?.products ?? [];

  const { data: ordersData, isLoading: ordersLoading } = useGetAllPurchaseOrder();
  const orders = useMemo(() => ordersData?.purchaseOrders || [], [ordersData?.purchaseOrders]);
  const pagination = usePagination(orders);

  const addPurchaseOrderMutation = useAddPurchaseOrder();
  const editPurchaseOrderMutation = useEditPurchaseOrder();
  const updatePurchaseOrderMutation = useUpdatePurchaseOrder();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormData = useMemo(
    () => buildInitialForm(userRole, user?.storeId),
    [userRole, user?.storeId]
  );
  const [formData, setFormData] = useState(initialFormData);

  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const { data: itemProductSearchData } = useGetAllProducts(itemSearchTerm);
  const itemSearchResults = itemSearchTerm ? itemProductSearchData?.products || [] : [];

  const getStoreName = (storeId) => stores.find((s) => s.storeId === storeId)?.name || storeId;
  const getProductByBarcode = (barcode) => products.find((p) => p.barcode_text === barcode);

  const resetForm = () => {
    setFormData(buildInitialForm(userRole, user?.storeId));
    setActiveSearchIndex(null);
    setItemSearchTerm('');
  };

  const openCreateModal = () => {
    resetForm();
    setEditingOrder(null);
    setShowCreateModal(true);
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setFormData({
      supplierName: order.supplierName || '',
      supplierMobile: order.supplierMobile || '',
      storeId: order.storeId || '',
      expectedDeliveryDate: order.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0]
        : '',
      items: (order.items || []).map((item) => ({
        barcode_text: item.barcode_text,
        quantity: item.quantity,
        matchedProduct: getProductByBarcode(item.barcode_text) || { barcode_text: item.barcode_text },
      })),
    });
    setActiveSearchIndex(null);
    setItemSearchTerm('');
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingOrder(null);
    resetForm();
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] });
  };

  const handleRemoveItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    if (activeSearchIndex === index) {
      setActiveSearchIndex(null);
      setItemSearchTerm('');
    }
  };

  const handleItemSearchChange = (index, value) => {
    setActiveSearchIndex(index);
    setItemSearchTerm(value);
  };

  const handleSelectProduct = (index, product) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      barcode_text: product.barcode_text,
      matchedProduct: product,
    };
    setFormData({ ...formData, items: newItems });
    setActiveSearchIndex(null);
    setItemSearchTerm('');
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], quantity: parseInt(value) || 0 };
    setFormData({ ...formData, items: newItems });
  };

  const calculateFormTotal = useCallback(() => {
    return formData.items.reduce((sum, item) => sum + item.quantity * (item.matchedProduct?.mrp || 0), 0);
  }, [formData.items]);

  const formTotal = useMemo(() => calculateFormTotal(), [calculateFormTotal]);

  const handleSavePO = async () => {
    const invalidItems = formData.items.filter(
      (item) => !item.matchedProduct || !item.quantity || item.quantity <= 0
    );
    if (
      !formData.supplierName.trim() ||
      !formData.supplierMobile.trim() ||
      !formData.storeId ||
      invalidItems.length > 0
    ) {
      toast.error('Please enter supplier name, mobile, store, and a valid product for every item');
      return;
    }

    if (formData.supplierMobile.trim().length < 10) {
      toast.error('Supplier mobile must be at least 10 digits');
      return;
    }

    const payload = {
      storeId: formData.storeId,
      supplierName: formData.supplierName.trim(),
      supplierMobile: formData.supplierMobile.trim(),
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      items: formData.items.map((item) => ({
        barcode_text: item.barcode_text,
        quantity: item.quantity,
      })),
    };

    try {
      if (editingOrder) {
        await editPurchaseOrderMutation.mutateAsync({ id: editingOrder._id, ...payload });
        toast.success('Purchase order updated successfully!');
      } else {
        await addPurchaseOrderMutation.mutateAsync(payload);
        toast.success('Purchase order created successfully!');
      }
      closeModal();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          (editingOrder ? 'Failed to update purchase order' : 'Failed to create purchase order')
      );
    }
  };

  const handleStatusChange = async (order, status, successMessage) => {
    try {
      await updatePurchaseOrderMutation.mutateAsync({ id: order._id, status });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update purchase order');
    }
  };

  const handleApprove = (order) => handleStatusChange(order, 'Approved', 'Purchase order approved!');
  const handleReceive = (order) => handleStatusChange(order, 'Received', 'Purchase order marked as received!');
  const handleCancel = (order) => {
    if (userRole === 'admin' && confirm('Are you sure you want to reject this purchase order?')) {
      handleStatusChange(order, 'Rejected', 'Purchase order rejected!');
    }
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.purchaseOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.supplierMobile?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [orders, searchTerm]
  );

  const filteredPagination = usePagination(filteredOrders);

  const orderStats = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === 'Pending').length,
      approved: orders.filter((o) => o.status === 'Approved').length,
      received: orders.filter((o) => o.status === 'Received').length,
    }),
    [orders]
  );

  const getOrderEstimatedValue = (order) =>
    order.items.reduce((sum, item) => {
      const matched = getProductByBarcode(item.barcode_text);
      return sum + item.quantity * (matched?.mrp || 0);
    }, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Received':
        return { bg: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> };
      case 'Approved':
        return { bg: 'bg-blue-100 text-blue-700', icon: <Clock size={16} /> };
      case 'Pending':
        return { bg: 'bg-orange-100 text-orange-700', icon: <Clock size={16} /> };
      case 'Rejected':
        return { bg: 'bg-red-100 text-red-700', icon: <XCircle size={16} /> };
      default:
        return { bg: 'bg-gray-100 text-gray-700', icon: <XCircle size={16} /> };
    }
  };

  const isSaving = addPurchaseOrderMutation.isPending || editPurchaseOrderMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Purchase Orders</h2>
          <p className="text-gray-600 mt-1">
            {userRole === 'admin' ? 'Manage supplier purchase orders' : 'Manage purchase orders for your store'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Create Purchase Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Orders</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{orders.length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
          <p className="text-orange-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{orderStats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-blue-600 text-sm">Approved</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{orderStats.approved}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-600 text-sm">Received</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{orderStats.received}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by PO number, supplier, or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {ordersLoading && <div className="text-center py-8 text-gray-500">Loading purchase orders...</div>}
        {!ordersLoading &&
          filteredPagination.paginatedItems.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            return (
              <div key={order._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Package className="text-amber-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{order.purchaseOrderId}</h3>
                      <p className="text-sm text-gray-600">
                        Order Date: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${statusBadge.bg} w-fit`}
                  >
                    {statusBadge.icon}
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Supplier</p>
                    <p className="font-medium text-gray-800">{order.supplierName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Supplier Mobile</p>
                    <p className="font-medium text-gray-800">{order.supplierMobile || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Destination</p>
                    <p className="font-medium text-gray-800">{getStoreName(order.storeId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expected Delivery</p>
                    <p className="font-medium text-gray-800">
                      {order.expectedDeliveryDate
                        ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-700">Items:</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-gray-800">{item.barcode_text}</span>
                      <span className="text-gray-600">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.status === 'Pending' && (
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(order)}
                        className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                      {userRole === 'admin' ? (
                        <>
                          <button
                            onClick={() => handleApprove(order)}
                            disabled={updatePurchaseOrderMutation.isPending}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleCancel(order)}
                            disabled={updatePurchaseOrderMutation.isPending}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 text-center py-2 bg-gray-100 text-sm text-gray-600 rounded-lg">
                          Waiting for admin approval
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {order.status === 'Approved' && (
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <button
                      onClick={() => handleReceive(order)}
                      disabled={updatePurchaseOrderMutation.isPending}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <CheckCircle size={16} />
                      Mark as Received
                    </button>
                  </div>
                )}

                {order.status === 'Received' && (
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <button
                      type="button"
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      Share on WhatsApp
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <Pagination
        page={filteredPagination?.page || 1}
        totalPages={filteredPagination?.totalPages || 1}
        totalItems={filteredPagination?.totalItems || 0}
        pageSize={filteredPagination?.pageSize || 10}
        onPageChange={filteredPagination?.goToPage}
      />

      {showCreateModal && (
        <Modal
          title={editingOrder ? `Edit Purchase Order — ${editingOrder.purchaseOrderId}` : 'Create Purchase Order'}
          onClose={closeModal}
          size="lg"
          footer={
            <>
              <button type="button" onClick={closeModal} className={modalSecondaryBtnClass}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePO}
                disabled={isSaving}
                className={modalPrimaryBtnClass}
              >
                {isSaving
                  ? editingOrder
                    ? 'Saving…'
                    : 'Creating…'
                  : editingOrder
                    ? 'Save Changes'
                    : 'Create Purchase Order'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-4">
            <div>
              <label className={modalLabelClass}>Supplier *</label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                className={modalInputClass}
                placeholder="Enter supplier name"
                autoComplete="off"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Supplier Mobile *</label>
              <input
                type="tel"
                value={formData.supplierMobile}
                onChange={(e) => setFormData({ ...formData, supplierMobile: e.target.value })}
                className={modalInputClass}
                placeholder="Enter mobile number"
                autoComplete="off"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Destination Store</label>
              <select
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className={modalInputClass}
                disabled={userRole === 'manager'}
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Expected Delivery Date</label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className={modalInputClass}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="relative mb-2">
                    <label className="block text-xs text-gray-600 mb-1">Product (must already exist)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={
                          activeSearchIndex === index
                            ? itemSearchTerm
                            : item.matchedProduct
                              ? item.barcode_text
                              : ''
                        }
                        onChange={(e) => handleItemSearchChange(index, e.target.value)}
                        onFocus={() => setActiveSearchIndex(index)}
                        placeholder="Search by barcode, SKU, or product code..."
                        className={`${modalInputClass} pl-9`}
                      />
                    </div>

                    {activeSearchIndex === index && itemSearchTerm.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                        {itemSearchResults.length > 0 ? (
                          itemSearchResults.map((product) => (
                            <div
                              key={product._id}
                              onClick={() => handleSelectProduct(index, product)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{product.sku_code}</div>
                                  <div className="text-sm text-gray-600">Barcode: {product.barcode_text}</div>
                                </div>
                                <div className="font-medium text-amber-600">₹{product.mrp || 0}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-gray-500">
                            No matching product found. Purchase orders can only include existing products.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className={modalInputClass}
                      />
                    </div>
                    <div className="col-span-3">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-base font-bold text-gray-800">Total Amount:</span>
            <span className="text-xl font-bold text-amber-600">₹{formTotal.toLocaleString()}</span>
          </div>
        </Modal>
      )}
    </div>
  );
}
