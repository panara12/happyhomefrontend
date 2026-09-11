import { useCallback, useMemo, useState } from 'react';
import { Plus, CheckCircle, Clock, XCircle, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreContext } from '../../context/storeContext';
import { useGetAllStockGroup } from '../../hooks/useStockGroup';
import { useGetAllProducts } from '../../hooks/useProduct';
import { useAddPurchaseOrder, useUpdatePurchaseOrder, useGetAllPurchaseOrder } from '../../hooks/usePurchaseOrder';
import { useSelector } from 'react-redux';
import { useLoggedUserContext } from '../../context/loggedUserContext';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';

const emptyItem = { barcode_text: '', quantity: 1, matchedProduct: null };

export default function PurchaseOrders() {
  const { loggedUser:user} = useLoggedUserContext();

  const userRole = user.userType; 

  const { stores } = useStoreContext();
  const { data: stockGroupData } = useGetAllStockGroup();
  const stockGroup = stockGroupData?.data ?? [];
  const { data: productsData } = useGetAllProducts();
  const products = productsData?.products ?? [];

  const { data: ordersData, isLoading: ordersLoading } = useGetAllPurchaseOrder();
  // const orders = ordersData?.purchaseOrders ?? [];
  const orders = useMemo(() => ordersData?.purchaseOrders || [], [ordersData?.purchaseOrders])
  const pagination = usePagination(orders)

  // mutateAsync + try/catch style, matching StoreManagement's handleAddStore
  const addPurchaseOrderMutation = useAddPurchaseOrder();
  const updatePurchaseOrderMutation = useUpdatePurchaseOrder();
  // const pagination = usePagination(orders)
  // console.log(pagination)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormData = {
    supplierId: '',
    storeId: userRole === 'manager' && user.storeId ? user.storeId : '',
    expectedDeliveryDate: '',
    items: [{ ...emptyItem }]
  };
  const [formData, setFormData] = useState(initialFormData);

  // Search existing product for a given item row — mirrors the Purchase Bill page's pattern.
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const { data: itemProductSearchData } = useGetAllProducts(itemSearchTerm);
  const itemSearchResults = itemSearchTerm ? (itemProductSearchData?.products || []) : [];

  const getSupplierName = (supplierId) => stockGroup.find(sg => sg._id === supplierId)?.name || supplierId || '-';
  const getStoreName = (storeId) => stores.find(s => s.storeId === storeId)?.name || storeId;
  const getProductByBarcode = (barcode) => products.find(p => p.barcode_text === barcode);

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
      matchedProduct: product // client-only, used for display + total estimate, never sent to backend
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
    return formData.items.reduce((sum, item) => sum + (item.quantity * (item.matchedProduct?.mrp || 0)), 0);
  }, [formData.items]);

  const formTotal = useMemo(() => calculateFormTotal(), [calculateFormTotal]);

  // Was: addPurchaseOrder(payload, { onSuccess, onError })
  // Now: mutateAsync inside a try/catch, same shape as handleAddStore.
  const handleCreatePO = async () => {
    const invalidItems = formData.items.filter(item => !item.matchedProduct || !item.quantity || item.quantity <= 0);
    if (!formData.supplierId || !formData.storeId || invalidItems.length > 0) {
      toast.error('Please select a supplier, store, and a valid existing product for every item');
      return;
    }

    const payload = {
      storeId: formData.storeId,
      supplierId: formData.supplierId,
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      items: formData.items.map(item => ({
        barcode_text: item.barcode_text,
        quantity: item.quantity
      }))
    };

    try {
      await addPurchaseOrderMutation.mutateAsync(payload);
      toast.success('Purchase order created successfully!');
      setFormData(initialFormData);
      setShowCreateModal(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create purchase order');
    }
  };

  // Was: updatePurchaseOrder({ id, status }, { onSuccess, onError })
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

  const filteredOrders = useMemo(() => orders.filter(o =>
    o.purchaseOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSupplierName(o.supplierId).toLowerCase().includes(searchTerm.toLowerCase())
  ), [orders, searchTerm, stockGroup]);

  const orderStats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'Pending').length,
    approved: orders.filter(o => o.status === 'Approved').length,
    received: orders.filter(o => o.status === 'Received').length,
  }), [orders]);

  const getOrderEstimatedValue = (order) => order.items.reduce((sum, item) => {
    const matched = getProductByBarcode(item.barcode_text);
    return sum + (item.quantity * (matched?.mrp || 0));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Purchase Orders</h2>
          <p className="text-gray-600 mt-1">
            {userRole === 'admin' ? 'Manage supplier purchase orders' : `Manage purchase orders for your store`}
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
          placeholder="Search by PO number or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {ordersLoading && (
          <div className="text-center py-8 text-gray-500">Loading purchase orders...</div>
        )}
        {!ordersLoading && pagination.paginatedItems.map(order => {
          const statusBadge = getStatusBadge(order.status);
          const estimatedValue = getOrderEstimatedValue(order);
          return (
            <div key={order._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Package className="text-amber-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{order.purchaseOrderId}</h3>
                    <p className="text-sm text-gray-600">Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
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
                  <p className="font-medium text-gray-800">{getSupplierName(order.supplierId)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Destination</p>
                  <p className="font-medium text-gray-800">{getStoreName(order.storeId)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expected Delivery</p>
                  <p className="font-medium text-gray-800">
                    {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">Items:</p>
                {order.items.map((item, idx) => {
                  const matched = getProductByBarcode(item.barcode_text);
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-gray-800">{item.barcode_text}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {order.status === 'Pending' && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  {userRole === 'admin' ? (
                    <div className="flex gap-2">
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
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-gray-400 text-sm text-gray-600">
                      Waiting for admin approval
                    </div>
                  )}
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
            </div>
          );
        })}
      </div>
      <Pagination
                  page={pagination?.page || 1}
                  totalPages={pagination?.totalPages || 1}
                  totalItems={pagination?.totalItems || 0}
                  pageSize={pagination?.pageSize || 10}
                  onPageChange={pagination?.goToPage}
                />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Purchase Order</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Supplier</option>
                  {stockGroup.map(sg => (
                    <option key={sg._id} value={sg._id}>{sg.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination Store</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  disabled={userRole === 'manager'}
                >
                  <option value="">Select Store</option>
                  {stores.map(store => (
                    <option key={store.storeId} value={store.storeId}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
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
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="relative mb-2">
                      <label className="block text-xs text-gray-600 mb-1">Product (must already exist)</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={activeSearchIndex === index ? itemSearchTerm : (item.matchedProduct ? item.barcode_text : '')}
                          onChange={(e) => handleItemSearchChange(index, e.target.value)}
                          onFocus={() => setActiveSearchIndex(index)}
                          placeholder="Search by barcode, SKU, or product code..."
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="col-span-3">
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
                  </div>
                ))}
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
                disabled={addPurchaseOrderMutation.isPending}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
              >
                {addPurchaseOrderMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}