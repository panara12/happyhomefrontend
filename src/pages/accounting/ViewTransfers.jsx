import { useEffect, useMemo, useState } from 'react';
import { Search, ArrowLeftRight, Eye, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useGetTransfers } from '../../hooks/useTransfer';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-CA');
}

/** Map API status to accounting UI labels (approved = in_transit | completed) */
function displayStatus(status) {
  if (status === 'in_transit' || status === 'completed') return 'approved';
  return status || 'pending';
}

function statusBadgeClass(status) {
  const s = displayStatus(status);
  if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (s === 'approved') return 'bg-green-100 text-green-800';
  if (s === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function statusIcon(status) {
  const s = displayStatus(status);
  if (s === 'pending') return '⏳ ';
  if (s === 'approved') return '✅ ';
  if (s === 'rejected') return '❌ ';
  return '';
}

function statusLabel(status) {
  const s = displayStatus(status);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapTransfer(t) {
  return {
    id: t._id || t.id,
    transferNumber: t.transferNumber || t.id,
    fromStore: t.fromStore || t.fromStoreId || '—',
    toStore: t.toStore || t.toStoreId || '—',
    items: [
      {
        name: t.product || t.productCode || 'Product',
        quantity: t.quantity || 0,
      },
    ],
    status: t.status,
    requestDate: formatDate(t.date || t.createdAt),
    requestedBy: t.requestedBy || '—',
    processedBy: t.approvedBy || null,
    processedDate: formatDate(t.approvedAt || t.completedAt),
    notes: t.reason || '',
    raw: t,
  };
}

export default function ViewTransfers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // API status filter: "approved" means in_transit OR completed — fetch all then filter client-side for that
  const apiStatus =
    filterStatus === 'all' || filterStatus === 'approved' ? undefined : filterStatus;

  const { data, isLoading, isError } = useGetTransfers({
    q: debouncedSearch,
    status: apiStatus,
    limit: 100,
  });

  const transfers = useMemo(
    () => (data?.transfers || []).map(mapTransfer),
    [data]
  );

  const summary = data?.summary || {
    total: 0,
    pending: 0,
    in_transit: 0,
    completed: 0,
    rejected: 0,
  };

  const filteredTransfers = useMemo(() => {
    if (filterStatus === 'approved') {
      return transfers.filter(
        (t) => t.status === 'in_transit' || t.status === 'completed'
      );
    }
    if (filterStatus !== 'all') {
      return transfers.filter((t) => t.status === filterStatus);
    }
    return transfers;
  }, [transfers, filterStatus]);

  const stats = {
    total: summary.total,
    pending: summary.pending,
    approved: (summary.in_transit || 0) + (summary.completed || 0),
    rejected: summary.rejected,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Transfers</h1>
          <p className="text-sm text-gray-600 mt-1">View-only access to all store transfer requests</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="text-blue-600 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              <strong>Read-Only Mode:</strong> You can view all transfer requests but cannot approve or reject them.
              This is for monitoring and audit purposes only.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ArrowLeftRight className="text-indigo-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transfers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-yellow-800">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-green-800">Approved</p>
              <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-red-800">Rejected</p>
              <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by store, manager, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">From Store</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">To Store</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Request Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Requested By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading transfers...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-600">
                    Failed to load transfers
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {transfer.transferNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-blue-500" />
                        {transfer.fromStore}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-green-500" />
                        {transfer.toStore}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transfer.items.length} item(s)
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transfer.requestDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transfer.requestedBy}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(transfer.status)}`}
                      >
                        {statusIcon(transfer.status)}
                        {statusLabel(transfer.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedTransfer(transfer)}
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && !isError && filteredTransfers.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600">No transfers found matching your criteria</p>
          </div>
        )}
      </div>

      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Transfer Details</h2>
              <button
                type="button"
                onClick={() => setSelectedTransfer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusBadgeClass(selectedTransfer.status)}`}
                >
                  {statusIcon(selectedTransfer.status)}
                  {statusLabel(selectedTransfer.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-800 mb-1">From Store</p>
                  <p className="font-medium text-blue-900">{selectedTransfer.fromStore}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-800 mb-1">To Store</p>
                  <p className="font-medium text-green-900">{selectedTransfer.toStore}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transfer ID:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedTransfer.transferNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Request Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedTransfer.requestDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Requested By:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedTransfer.requestedBy}
                  </span>
                </div>
                {selectedTransfer.processedBy && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Processed By:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedTransfer.processedBy}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Processed Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedTransfer.processedDate}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Items to Transfer</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTransfer.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{selectedTransfer.notes}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900 text-center">
                  📋 This is a read-only view. You cannot modify or process this transfer.
                </p>
              </div>
            </div>

            <div className="p-6 border-t">
              <button
                type="button"
                onClick={() => setSelectedTransfer(null)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
