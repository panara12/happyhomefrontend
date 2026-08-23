import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, ArrowRight, CheckCircle, Clock, XCircle, Search, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { useGetAllStores } from '../../hooks/useStore';
import { useGetAllProducts } from '../../hooks/useProduct';
import { useCreateTransfer, useGetTransfers, useUpdateTransferStatus } from '../../hooks/useTransfer';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-CA');
}

function statusLabel(status) {
  if (status === 'in_transit') return 'In Transit';
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function normalizeStoreId(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export default function TransferManagement({ user: userProp }) {
  const reduxUser = useSelector((state) => state.app.userInfo);
  const user = reduxUser || userProp;
  const role = user?.userType || user?.role;
  const isAdmin = role === 'admin';
  const loginStoreId = normalizeStoreId(user?.storeId);
  // Manager always uses assigned store (e.g. hph001). Admin has no storeId — picks From Store.
  const isFromStoreLocked = Boolean(loginStoreId) && !isAdmin;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    fromStoreId: loginStoreId || '',
    toStoreId: '',
    quantity: 1,
    reason: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useGetTransfers({ q: debouncedSearch, limit: 100 });
  const { data: storesData } = useGetAllStores();
  const { data: productsData } = useGetAllProducts(productQuery);
  const createTransferMutation = useCreateTransfer();
  const updateStatusMutation = useUpdateTransferStatus();

  const transfers = data?.transfers || [];
  const summary = data?.summary || { total: 0, pending: 0, in_transit: 0, completed: 0 };
  const stores = storesData?.stores || [];
  const products = productsData?.products || [];

  const fromStoreId = isFromStoreLocked
    ? loginStoreId
    : normalizeStoreId(formData.fromStoreId);

  const fromStore = useMemo(() => {
    if (!fromStoreId) return null;
    return stores.find(
      (s) => normalizeStoreId(s.storeId).toLowerCase() === fromStoreId.toLowerCase()
    ) || null;
  }, [stores, fromStoreId]);

  const toStoreOptions = useMemo(() => {
    if (!fromStoreId) return stores;
    return stores.filter(
      (s) => normalizeStoreId(s.storeId).toLowerCase() !== fromStoreId.toLowerCase()
    );
  }, [stores, fromStoreId]);

  const fromStoreLabel = fromStore
    ? `${fromStore.name} (${fromStore.storeId})`
    : fromStoreId || 'No store assigned';

  useEffect(() => {
    if (loginStoreId && isFromStoreLocked) {
      setFormData((prev) =>
        prev.fromStoreId === loginStoreId ? prev : { ...prev, fromStoreId: loginStoreId }
      );
    }
  }, [loginStoreId, isFromStoreLocked]);

  const productOptions = useMemo(() => {
    return products.slice(0, 20).map((p) => {
      const storeQty = (p.qty || []).find(
        (q) => normalizeStoreId(q.storeId).toLowerCase() === fromStoreId.toLowerCase()
      );
      const available = Number(storeQty?.qty || 0);
      return {
        id: p._id,
        label: p.sku_code || p.barcode_text,
        subLabel: `Code: ${p.product_code || '-'} • Available: ${available}`,
        raw: p,
      };
    });
  }, [products, fromStoreId]);

  useEffect(() => {
    if (!formData.toStoreId && toStoreOptions.length) {
      setFormData((prev) => ({ ...prev, toStoreId: toStoreOptions[0].storeId }));
    }
    if (
      formData.toStoreId &&
      normalizeStoreId(formData.toStoreId).toLowerCase() === fromStoreId.toLowerCase() &&
      toStoreOptions.length
    ) {
      setFormData((prev) => ({ ...prev, toStoreId: toStoreOptions[0].storeId }));
    }
  }, [toStoreOptions, formData.toStoreId, fromStoreId]);

  const handleCreateTransfer = () => {
    if (!fromStoreId) {
      toast.error(isAdmin ? 'Please select From Store' : 'Your account has no store assigned');
      return;
    }
    if (!selectedProduct?._id) {
      toast.error('Please select a product');
      return;
    }
    if (!formData.toStoreId) {
      toast.error('Please select destination store');
      return;
    }
    if (!formData.quantity || formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    createTransferMutation.mutate(
      {
        toStoreId: formData.toStoreId,
        productId: selectedProduct._id,
        quantity: Number(formData.quantity),
        reason: formData.reason || '',
        ...(isAdmin ? { fromStoreId } : {}),
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setSelectedProduct(null);
          setProductQuery('');
          setFormData({
            fromStoreId: loginStoreId || '',
            toStoreId: '',
            quantity: 1,
            reason: '',
          });
        },
      }
    );
  };

  const handleAccept = (transfer) => {
    updateStatusMutation.mutate(
      { id: transfer._id || transfer.id, status: 'in_transit' },
      { onSuccess: () => toast.success('Transfer accepted') }
    );
  };

  const handleComplete = (transfer) => {
    updateStatusMutation.mutate(
      { id: transfer._id || transfer.id, status: 'completed' },
      { onSuccess: () => toast.success('Transfer completed') }
    );
  };

  const handleReject = (transfer) => {
    if (!confirm('Are you sure you want to reject this transfer?')) return;
    updateStatusMutation.mutate(
      { id: transfer._id || transfer.id, status: 'rejected' },
      { onSuccess: () => toast.success('Transfer rejected') }
    );
  };

  const transfersPagination = usePagination(transfers);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> };
      case 'in_transit':
        return { bg: 'bg-blue-100 text-blue-700', icon: <Clock size={16} /> };
      case 'pending':
        return { bg: 'bg-orange-100 text-orange-700', icon: <Clock size={16} /> };
      case 'rejected':
        return { bg: 'bg-red-100 text-red-700', icon: <XCircle size={16} /> };
      default:
        return { bg: 'bg-gray-100 text-gray-700', icon: <XCircle size={16} /> };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Store Transfers</h2>
          <p className="text-gray-600 mt-1">Request and accept inventory transfers</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Create Transfer Request
        </button>
      </div>

      {role === 'manager' && (
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Transfers</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
          <p className="text-orange-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{summary.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-blue-600 text-sm">In Transit</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.in_transit}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-600 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.completed}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search transfers by ID, product, or store..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading transfers...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {transfersPagination.paginatedItems.map((transfer) => {
            const statusBadge = getStatusBadge(transfer.status);
            const isIncoming = loginStoreId && transfer.toStoreId === loginStoreId;
            const isOutgoing = loginStoreId && transfer.fromStoreId === loginStoreId;

            return (
              <div
                key={transfer._id || transfer.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 ${
                  isIncoming ? 'border-l-4 border-green-500' : isOutgoing ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{transfer.transferNumber}</h3>
                    <p className="text-sm text-gray-600">{formatDate(transfer.date || transfer.createdAt)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.bg}`}>
                    {statusBadge.icon}
                    {statusLabel(transfer.status)}
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
                    <span className="text-gray-800">{transfer.requestedBy || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved By:</span>
                    <span className="text-gray-800">{transfer.approvedBy || '—'}</span>
                  </div>
                </div>

                {transfer.status === 'pending' && (
                  <div className="pt-4 border-t border-gray-200">
                    {role === 'admin' || isIncoming ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(transfer)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} />
                          {role === 'admin' ? 'Approve' : 'Accept Request'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(transfer)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle size={16} />
                          {role === 'admin' ? 'Reject' : 'Decline'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-sm text-gray-600">
                        Waiting for receiving store approval
                      </div>
                    )}
                  </div>
                )}

                {transfer.status === 'in_transit' && (
                  <div className="pt-4 border-t border-gray-200">
                    {role === 'admin' || isIncoming ? (
                      <button
                        type="button"
                        onClick={() => handleComplete(transfer)}
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

          {!transfersPagination.paginatedItems.length && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No transfers found
            </div>
          )}
        </div>
      )}

      <Pagination
        page={transfersPagination.page}
        totalPages={transfersPagination.totalPages}
        totalItems={transfersPagination.totalItems}
        pageSize={transfersPagination.pageSize}
        onPageChange={transfersPagination.goToPage}
      />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Transfer Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Store</label>
                {isFromStoreLocked ? (
                  <input
                    type="text"
                    value={fromStoreLabel}
                    disabled
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 outline-none cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={formData.fromStoreId || ''}
                    onChange={(e) => setFormData({ ...formData, fromStoreId: e.target.value, toStoreId: '' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select store</option>
                    {stores.map((store) => (
                      <option key={store.storeId} value={store.storeId}>
                        {store.name} ({store.storeId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Store</label>
                <select
                  value={formData.toStoreId}
                  onChange={(e) => setFormData({ ...formData, toStoreId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  {toStoreOptions.length === 0 && (
                    <option value="">No other stores available</option>
                  )}
                  {toStoreOptions.map((store) => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <AutocompleteInput
                label="Product"
                placeholder="Select Product"
                value={productQuery}
                onChange={(val) => {
                  setProductQuery(val);
                  setSelectedProduct(null);
                }}
                onSelect={(opt) => {
                  setSelectedProduct(opt.raw);
                  setProductQuery(opt.label);
                }}
                options={productOptions}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Why is this transfer needed?"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTransfer}
                disabled={createTransferMutation.isPending}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-60"
              >
                {createTransferMutation.isPending ? 'Creating...' : 'Create Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
